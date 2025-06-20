### Installation
1. Provision all required credentials and database
2. Clone the repo
   ```sh
   git clone https://github.com/pclubiitk/Campus-Compass-25.git
   cd Campus-Compass-25/server
   ```
3. cp `secret.yml.template` to `secret.yml` and fill in the required credentials
4. Save GCP credentials as `secret.GCPcredentials.json`
5. Install go dependencies
   ```sh
   go mod tidy
   ```
6. Ensure that the rabbitmq service and postgres service is up and running in your local machine. 
8. Update the configs.yml, ensure you have the database initialize (just the database, no need to create tables) 
7. Build the project
   ```sh
   go build server -o ./cmd/.
   ```
8. Run the project
   ```sh
   ./server
   ```