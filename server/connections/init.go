// Central place to call all other config inits (viper, logging etc.)
//other pages get called 
package connections

func init() {
	// Initialize Viper configuration
	viperConfig()
	// Initialize logging
	logrusConfig()
	// Initialize RabbitMq connection
	initRabbitMQ()
	// Database connection
	dbConnection()
	// Connect to moderator ai client
	aiConnection()
}
