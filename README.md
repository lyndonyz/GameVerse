# How to Run GameVerse Locally:
## GameVerse Web Application for Software Architecture 

Node Version: v24.11.0.<br>Make sure you have [Visual Studio Code](https://code.visualstudio.com/).

## Step For WINDOWS: 
Use Chocolatey v2.5.1. for consistency with this documentation. Otherwise if you can set it up without it, you can continue.
<br>Read how to install Chocolatey on their [official documentation](https://chocolatey.org/install) for proper installation of node.js

## Step For MacOS: 
You can install Node.js on a Mac by downloading the official installer from the [Node.js website](https://nodejs.org/en), or by using the Homebrew package manager.

## Next steps: 
Ensure you have node installed.
<br>Check using:
```node -v```
<br>Also check if npm is working and check:
```npm -v```

Make a new Directory called 4471 somewhere.
<br>Navigate into 4471.
<br>Clone the Repo to your local machine. Use HTTPS cloning.

Should look like:
<br>
```
/4471/GameVerse/(the other folder/files)
```

Once you clone the repo, navigate into **GameVerse** folder.
<br>Then navigate into the **web** folder and do: 
```npm install```
<br>Navigate out of the **web** folder and navigate into the **server** folder and do: 
```npm install```
<br>Navigate back out into the **GameVerse** folder and do 
```npm install```

Once done, you should be able to run the web application locally using: 
```npm run dev```

# Notes on How our Code is Ran/Managed.
It's running **Vite** + **React** + **Express**.
<br>User and Comment Databases are ran remotely via **IBM Cloud Databses**.
<br>The service registry is controlled by our Admin account, which enables us to manually turn on/off microservices.
<br>Our User passwords are encrypted by **bcrypt**.
<br>Both our backend and frontend are ran on **IBM Cloud** and deployed using both **Docker** and **IBM Cloud CE**.

# How to Push and Pull GameVerse Repo:
## Using Visual Studio Code to Push Stuff

I think it should be pretty obvious, but I'll write this just in case.

Go to Visual Studio Code -> File -> Open Folder -> Select 4471 Folder.
<br>Visual Studio Code will then prompt you if you trust this Author or whatever, just say yes.

Any changes you make will appear on the left side, with the branch icon (the lines with 3 circles).
<br>To commit and push, just click the + symbols on the files you want to commit, and write the message on the top to comment what you did.

**WHATEVER YOU DO, DO NOT COMMIT ANY NODE_MODULE FILES, AND MAKE SURE THAT NO ONE ELSE IS WORKING ON A FILE WHEN YOU COMMIT.**
<br>**ALSO DO NOT COMMIT THE API KEY OR WE WILL GET DESTROYED BY RAWG.IO**

Message in the group chat if we are working on a specific file etc.

## Using Visual Studio Code to Pull Stuff

I can't remember exactly how it works, but it should tell you when theres something to pull when in the branch tab. If not, before you do something on a file, make sure that you click the pull button (the solid arrow pointing to a circle) as well as the refresh button.
<br>