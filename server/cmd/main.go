package main

import (
    "database/sql"
    "encoding/json"
    "log"
    "net/http"
    "github.com/streadway/amqp"
    _ "github.com/lib/pq"
)

var rabbitChan *amqp.Channel

func main() {
    conn, err := amqp.Dial("amqp://guest:guest@127.0.0.1:5672/")
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()

    rabbitChan, err = conn.Channel()
    if err != nil {
        log.Fatal(err)
    }
    defer rabbitChan.Close()

    rabbitChan.QueueDeclare("user_queue", false, false, false, false, nil)

    go startReceiver()

    db, err := sql.Open("postgres", "postgres://shivam:secret@localhost:5432/cc?sslmode=disable")
    if err != nil {
        log.Fatal("DB connect error:", err)
    }

    // HTTP routes
    http.HandleFunc("/user/get", getUserHandler(db))
    http.HandleFunc("/user/update", updateUserHandler(db))
    http.HandleFunc("/user/delete", deleteUserHandler(db))
    http.HandleFunc("/user/create", createUserHandler)

    log.Println("Listening on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}

func createUserHandler(w http.ResponseWriter, r *http.Request) {
    var user User
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        http.Error(w, "Invalid body", http.StatusBadRequest)
        return
    }

    body, _ := json.Marshal(user)
    rabbitChan.Publish("", "user_queue", false, false, amqp.Publishing{
        ContentType: "application/json",
        Body:        body,
    })

    w.WriteHeader(http.StatusAccepted)
    w.Write([]byte("User queued for creation"))
}
