// File for the set up of map server
package main

import (
	"compass/maps"
	"compass/middleware"
	"compass/requestlimit"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"net/http"
)

func mapsServer() *http.Server {
	PORT := viper.GetString("ports.maps")
	r := gin.New()
	r.Use(requestlimit.Middleware(requestlimit.MaxRequestBodyBytes))
	r.Use(middleware.CORS())
	r.Use(gin.Logger())

	maps.Router(r)

	server := &http.Server{
		Addr:         ":" + PORT,
		Handler:      r,
		ReadTimeout:  readTimeout,
		WriteTimeout: writeTimeout,
	}

	return server
}
