package main

import (
    "database/sql"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "strconv"
    _ "github.com/lib/pq"
)

func startReceiver() {
    db, err := sql.Open("postgres", "postgres://shivam:secret@localhost:5432/cc?sslmode=disable")
    if err != nil {
        log.Fatal("DB connect error:", err)
    }

    msgs, err := rabbitChan.Consume("user_queue", "", true, false, false, false, nil)
    if err != nil {
        log.Fatal("Queue consume error:", err)
    }

    go func() {
        for msg := range msgs {
            var user User
            if err := json.Unmarshal(msg.Body, &user); err != nil {
                log.Println("Invalid message:", err)
                continue
            }
            if err := insertUser(db, user); err != nil {
                log.Println("Insert failed:", err)
            } else {
                log.Println("User inserted:", user.Username)
            }
        }
    }()
}

// insert
func insertUser(db *sql.DB, user User) error {
    _, err := db.Exec("INSERT INTO users (username) VALUES ($1)", user.Username)
    return err
}

// get
func getUserHandler(db *sql.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        idStr := r.URL.Query().Get("id")
        id, err := strconv.Atoi(idStr)
        if err != nil {
            http.Error(w, "Invalid ID", http.StatusBadRequest)
            return
        }

        var user User
        err = db.QueryRow("SELECT id, username FROM users WHERE id=$1", id).Scan(&user.ID, &user.Username)
        if err != nil {
            http.Error(w, "User not found", http.StatusNotFound)
            return
        }

        json.NewEncoder(w).Encode(user)
    }
}

// update
func updateUserHandler(db *sql.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var user User
        json.NewDecoder(r.Body).Decode(&user)

        if user.ID == 0 || user.Username == "" {
            http.Error(w, "Missing ID or username", http.StatusBadRequest)
            return
        }

        _, err := db.Exec("UPDATE users SET username=$1 WHERE id=$2", user.Username, user.ID)
        if err != nil {
            http.Error(w, "Update failed", http.StatusInternalServerError)
            return
        }

        fmt.Fprintf(w, "User updated: %d", user.ID)
    }
}

// delete
func deleteUserHandler(db *sql.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        idStr := r.URL.Query().Get("id")
        id, err := strconv.Atoi(idStr)
        if err != nil {
            http.Error(w, "Invalid ID", http.StatusBadRequest)
            return
        }

        _, err = db.Exec("DELETE FROM users WHERE id=$1", id)
        if err != nil {
            http.Error(w, "Delete failed", http.StatusInternalServerError)
            return
        }

        fmt.Fprintf(w, "User deleted: %d", id)
    }
}
