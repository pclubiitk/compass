// File for the set up of auth server
package main

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"compass/middleware"
	"compass/auth"
)

func authServer() *http.Server {
	PORT := viper.GetString("ports.auth")
	r := gin.New()
	r.Use(middleware.CORS())
	r.Use(gin.Logger())

	auth.Router(r)

	server := &http.Server{
		Addr:         ":" + PORT,
		Handler:      r,
		ReadTimeout:  readTimeout,
		WriteTimeout: writeTimeout,
	}

	return server
}