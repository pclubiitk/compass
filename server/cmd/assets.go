package main

import (
	"compass/assets"
	"compass/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

func assetServer() *http.Server {
	PORT := viper.GetString("ports.assets")
	r := gin.New()
	r.Use(middleware.CORS())
	r.Use(gin.Logger())

	assets.Router(r)

	server := &http.Server{
		Addr:         ":" + PORT,
		Handler:      r,
		ReadTimeout:  readTimeout,
		WriteTimeout: writeTimeout,
	}

	return server
}
