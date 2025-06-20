// File for the set up of map server
package main

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"compass/middleware"
	"compass/maps"
)

func mapsServer() *http.Server {
	PORT := viper.GetString("ports.maps")
	r := gin.New()
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