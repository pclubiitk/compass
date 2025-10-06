package main

import (
	_ "compass/connections" // is a blank import and it runs the init() functions in the package
	"compass/workers"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"golang.org/x/sync/errgroup"
)

const (
	readTimeout  = 5 * time.Second  // Maximum duration for reading the entire request, Prevents a slow client from holding the connection open indefinitely while slowly sending data
	writeTimeout = 10 * time.Second // Maximum duration before timing out when writing the response to the client, Prevents the server from being stuck forever while trying to send data to a slow or unresponsive client.
)

func main() {
	// Create an error group to handle errors together
	var g errgroup.Group

	// In Production mode, will not print the routes as done in debug mode
	gin.SetMode(gin.ReleaseMode)

	// The concurrent workers running in background.
	// For now we are keeping them as background workers, as we expand, we can later convert them in to independent services.
	g.Go(func() error {
		return workers.ModeratorWorker()
	})
	g.Go(func() error {
		return workers.MailingWorker()
	})
	g.Go(func() error { return assetServer().ListenAndServe() })
	g.Go(func() error { return authServer().ListenAndServe() })
	g.Go(func() error { return mapsServer().ListenAndServe() })
	g.Go(func() error { return searchServer().ListenAndServe() })
	logrus.Info("Main server is Starting...")
	if err := g.Wait(); err != nil {
		logrus.Fatal("Some service failed with error: ", err)
	}

}
