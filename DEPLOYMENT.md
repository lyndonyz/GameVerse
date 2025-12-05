# How to Deploy GameVerse to IBM Cloud:
## Deploying GameVerse with Docker and IBM Cloud Code Engine

Make sure you have **Docker Desktop** installed and an **IBM Cloud account** set up.

## Prerequisites for Deployment:

### For MacOS:
You'll need Docker Desktop and IBM Cloud CLI.

**Install Docker Desktop**
<br>Download the Docker [Desktop Application](https://www.docker.com/products/docker-desktop)
<br>Just install it like any other Mac application and follow the steps it tells you. You could also download it threw brew, which is what I did and probably was less efficient then downloading through The official website.

**Install IBM Cloud CLI**
```bash
curl -fsSL https://clis.cloud.ibm.com/install/osx | sh
```

**Install IBM Cloud Plugins**
```bash
ibmcloud plugin install container-registry
ibmcloud plugin install code-engine
```

**Create an IBM Cloud account** 
<br>Go to [IBM Cloud](https://cloud.ibm.com) and sign up if you haven't already since we used IBM cloud with docker for this.

### For Windows:
The steps are basically the same, just download the Windows version of Docker Desktop and use the Windows installer for IBM Cloud CLI from their website.

## Deploying to IBM Cloud Code Engine:
### Login to IBM Cloud

```bash
ibmcloud login -sso
```

This will open your browser. Just follow the prompts and copy the one-time code.

Make sure you select the right region: **ca-tor**.

### Target Your Resource Group

```bash
ibmcloud resource groups
ibmcloud target -g Default
```

### Create a Code Engine Project

```bash
ibmcloud ce project create --name gameverse-project
ibmcloud ce project select --name gameverse-project
```

### Deploy the Backend Server

This is the important part. Code Engine will build directly from your GitHub repo, so make sure everything is pushed to GitHub first.

```bash
ibmcloud ce application create --name gameverse-server \
  --build-source https://github.com/lyndonyz/GameVerse \
  --build-context-dir server \
  --port 3000 \
  --min-scale 1 \
  --max-scale 3 \
  --cpu 0.5 \
  --memory 1G \
  --env CLOUDANT_URL=YOUR_CLOUDANT_URL \
  --env CLOUDANT_APIKEY=YOUR_CLOUDANT_APIKEY \
  --env EXTERNAL_API_KEY=YOUR_RAWG_API_KEY
```

**Replace:**
+ `YOUR_CLOUDANT_URL` with your Cloudant database URL
+ `YOUR_CLOUDANT_APIKEY` with your Cloudant API key
+ `YOUR_RAWG_API_KEY` with your RAWG.io API key

### Deploy the Frontend

```bash
ibmcloud ce application create --name gameverse-web \
  --build-source https://github.com/lyndonyz/GameVerse \
  --build-context-dir web \
  --port 80 \
  --min-scale 1 \
  --max-scale 3 \
  --cpu 0.25 \
  --memory 0.5G
```

Now the application should be on IBM Cloud. Use the provided URL that should of ben pasted when you created the frontend.
