// File for the set up of map server
package main

import (
	"compass/middleware"
	"compass/search"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"net/http"
)

func searchServer() *http.Server {
	PORT := viper.GetString("ports.search")
	r := gin.New()
	r.Use(middleware.CORS())
	r.Use(gin.Logger())

	search.Router(r)

	server := &http.Server{
		Addr:         ":" + PORT,
		Handler:      r,
		ReadTimeout:  readTimeout,
		WriteTimeout: writeTimeout,
	}

	return server
}
