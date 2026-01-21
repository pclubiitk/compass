package main

import (
	"compass/middleware"
	"compass/puppylove"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

func puppyloveServer() *http.Server {
	PORT := viper.GetString("ports.puppylove")
	r := gin.New()
	r.Use(middleware.CORS())
	r.Use(gin.Logger())

	puppylove.Router(r)

	server := &http.Server{
		Addr:         ":" + PORT,
		Handler:      r,
		ReadTimeout:  readTimeout,
		WriteTimeout: writeTimeout,
	}

	return server
}
