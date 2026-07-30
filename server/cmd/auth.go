// File for the set up of auth server
package main

import (
	"compass/auth"
	"compass/middleware"
	"compass/requestlimit"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"net/http"
)

func authServer() *http.Server {
	PORT := viper.GetString("ports.auth")
	r := gin.New()
	r.Use(requestlimit.Middleware(requestlimit.MaxRequestBodyBytes))
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
