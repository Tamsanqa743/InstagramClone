
class App {
  constructor() {

    this.userId = "";
    this.posts = [];
    this.following = [];
    this.imageUrl = "";
    this.clickedPostId = "";
    this.caption = "";
    this.state = 0;
    
    this.$loginUI = document.querySelector("#login-ui");
    this.$mainContainer = document.querySelector(".main-container");
    this.$logoutBtn = document.querySelector("#logout-btn");
    this.$name = document.querySelector(".name");
    this.$username = document.querySelector(".username");
    this.$uploadSection = document.querySelector("#upload-form");
    this.$createBtn = document.querySelector(".create-post");
    this.$shareBtn = document.querySelector(".share-btn");
    this.$closeBtn = document.querySelector(".close-btn");
    this.$postFiles = document.querySelector("#post-files");
    this.$modal = document.querySelector(".modal");
    this.$cancelBtn = document.querySelector(".cancel");
    this.$delete = document.querySelector(".delete");
    this.$editBtn = document.querySelector(".edit");
    this.ui = new firebaseui.auth.AuthUI(auth);
    this.handleAuth();
    this.addEventListeners();
  }

  handleAuth() {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.userId = String(user.uid);
        this.setName(user);
        this.redirectToApp();

      }
      else {
        // user must sign-in
        this.redirectToLogin();
      }
    })
  }

  setName(user){
    // set username of logged in user in home page
    this.$name.innerHTML = user.displayName;
    this.$username.innerHTML = user.displayName;
  }

  redirectToApp() {
    this.$mainContainer.style.display = "block"; // show main container div
    this.$loginUI.style.display = "none"; // hide login ui
    this.$uploadSection.style.display = "none"; //hide upload section
    this.getFeed();
  }

  redirectToLogin() {
    this.$loginUI.style.display = "block"; // show login ui
    this.$mainContainer.style.display = "none"; // hide main container
    this.$uploadSection.style.display = "none"; // hide upload section
    this.ui.start('#login-ui', {
      callbacks: {
        signInSuccessWithResult: (authResult, redirectUrl) => {
          this.userId = authResult.user.uid; // set userId to uid of logged in user
          this.redirectToApp();
        }
      },
      signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        firebase.auth.GoogleAuthProvider.PROVIDER_ID
      ],
    });
  }

  redirectToUpload() {
    this.$mainContainer.style.display = "none"; // hide main content container
    this.$uploadSection.style.display = "block"; // show upload section
  }

  // add event listerners to the document
  addEventListeners() {
    var files = [];
 
    // addd event listener for the logout button
    this.$logoutBtn.addEventListener("click", (event) => {
      // event.preventDefault();
      this.logout();
    });

    //add event listener for the create post button
    this.$createBtn.addEventListener("click", (event) => {
      event.preventDefault();
      this.createPost();

    });

    this.$closeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      //close create page and redirect to home
      this.redirectToApp();
      this.closeModal(); // close modal
      document.getElementById("uploading").innerHTML = "";
    });

    this.$postFiles.addEventListener("change", function (e) {
      files = e.target.files;
      for (let i = 0; i < files.length; i++) {
        console.log(files[i]);
      }
    });

    this.$shareBtn.addEventListener("click", function () {
      if (app.state == 0){
        //check if files are selected
        app.uploadHandler(files)
      }
      else{
        //update exisitng post
        const post = app.getPost(app.clickedPostId);
        app.editHandler(files,post.index, post.postObj.id, post.postObj.imageLink) // call edit handler function
        app.savePost();
      }
    });

    //close options modal
    this.$cancelBtn.addEventListener("click", (event) => {
      this.$modal.style.visibility = "hidden";
      console.log(this.posts)
    });


    //delete post
    this.$delete.addEventListener("click", (event) => {

      if (this.clickedPostId) {
          this.deleteHelper(this.clickedPostId);
          this.savePost();
          this.getFeed();
      }
      else{
        console.log("no post seleted!");
      }
      this.closeModal(); // close modal
    });

    this.$editBtn.addEventListener("click", (event)=>{
      this.editPost(this.clickedPostId);
    });
  }

  //redirect user to post page
  createPost() {
    this.$mainContainer.style.display = "none";
    this.$uploadSection.style.display = "block";
    this.$uploadSection.style.margin = "50px 0px 0px 0px";
  }

  // upload handler
  uploadHandler(files){

    if (files.length != 0){

        for (let i = 0; i < files.length; i++){
          // Create a root reference
          var storageRef = firebase.storage().ref();
        
            // Create the file metadata
          var metadata = {
          contentType: 'image/jpeg'
          };
        
          // Upload file and metadata to the object 'images/mountains.jpg'
          var uploadTask = storageRef.child('images/' + files[i].name).put(files[i], metadata);
        
          // Listen for state changes, errors, and completion of the upload.
          uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
          (snapshot) => {
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            document.getElementById("progress").value = progress;
            switch (snapshot.state) {
              case firebase.storage.TaskState.PAUSED: // or 'paused'
                console.log('Upload is paused');
                break;
              case firebase.storage.TaskState.RUNNING: // or 'running'
                console.log('Upload is running');
                break;
            }
          }, 
          (error) => {
            // A full list of error codes is available at
            // https://firebase.google.com/docs/storage/web/handle-errors
            switch (error.code) {
              case 'storage/unauthorized':
                // User doesn't have permission to access the object
                alert("Operation not allwowed!");
                break;
              case 'storage/canceled':
                // User canceled the upload
                alert("Operation cancelled!");
                break;
        
              case 'storage/unknown':
                // Unknown error occurred, inspect error.serverResponse
                alert("An error occured, try again!");
                break;
            }
          }, 
          () => {
            // Upload completed successfully, now we can get the download URL
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
              app.caption = document.getElementById("post-caption").value; // retrieve caption from upload div
              app.addPost(app.caption, downloadURL);
              app.savePost(); // save posts to firebase
              document.getElementById("uploading").innerHTML += `${files[i].name} uploaded <br />`;
        
            });
          });  
        }
      }
  }

  editHandler(files, index, postId, imageSrc){
    if (files.length != 0 ) {
      // if user selected new file
    
            for (let i = 0; i < files.length; i++){
              // Create a root reference
              var storageRef = firebase.storage().ref();
            
                // Create the file metadata
              var metadata = {
              contentType: 'image/jpeg'
              };
            
              // Upload file and metadata to the object 'images/mountains.jpg'
              var uploadTask = storageRef.child('images/' + files[i].name).put(files[i], metadata);
            
              // Listen for state changes, errors, and completion of the upload.
              uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
              (snapshot) => {
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                document.getElementById("progress").value = progress;
                switch (snapshot.state) {
                  case firebase.storage.TaskState.PAUSED: // or 'paused'
                    console.log('Upload is paused');
                    break;
                  case firebase.storage.TaskState.RUNNING: // or 'running'
                    console.log('Upload is running');
                    break;
                }
              }, 
              (error) => {
                // A full list of error codes is available at
                // https://firebase.google.com/docs/storage/web/handle-errors
                switch (error.code) {
                  case 'storage/unauthorized':
                    // User doesn't have permission to access the object
                    alert("Operation not allowed")
                    break;
                  case 'storage/canceled':
                    // User canceled the upload
                    alert("Operation cancelled")
                    break;
            
                  // ...
            
                  case 'storage/unknown':
                    // Unknown error occurred, inspect error.serverResponse
                    alert("An error occured, try again!")
                    break;
                }
              }, 
            () => {
              // Upload completed successfully, now we can get the download URL
              uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
              app.caption = document.getElementById("post-caption").value; // retrieve caption from upload div
              console.log(downloadURL)
              app.posts[index] = { id:postId, caption: app.caption, imageLink: downloadURL } //update post in array
              app.savePost(); // save posts to firebase
              document.getElementById("uploading").innerHTML += `${files[i].name} uploaded <br />`;
            
          });
        });  
      }
    }
    else {
      var postCaption = document.getElementById("post-caption").value;
      app.posts[index] = { id:postId, caption: postCaption, imageLink: imageSrc } //update post in array
      app.savePost();
      console.log(app.posts)
    }
  }

  // log the user out
  logout() {
    firebase.auth().signOut().then(() => {
      this.redirectToLogin()
    }).catch((error) => {
      console.log("ERROR OCCURED", error);
    });
  }

  // add post to the posts array

  addPost(postCaption, imageSrc ) {
    if (imageSrc != "") {
      const newPost = { id: cuid(), caption:postCaption, imageLink:imageSrc };
      this.posts = [...this.posts, newPost];
    }
  }


  //saves post to database under user's id
  savePost() {
    db.collection("users").doc(this.userId).set({
      posts: this.posts
    }).then(() => {
      console.log("Post saved successfully!");
      console.log(this.posts)
    }).catch((error) => {
      console.log("Error saving post:", error);
    });

    // this.displayFeed();
  }

  //helper method to delete functionality
  deleteHelper(id) {
    var storage =  firebase.storage()
    console.log(storage)
    for (let i = 0; i < this.posts.length; i++){
      if (this.posts[i].id === id){
        const imgLink = this.posts[i].imageLink;
        // Create a reference to the file to delete
        const fileRef = storage.refFromURL(imgLink);
        console.log('file ref', fileRef)

        // Delete the file
        fileRef.delete().then(() => {
          // File deleted successfully
        }).catch((error) => {
          // Uh-oh, an error occurred!
        });
      }
    }
    this.posts = this.posts.filter((post) => post.id != id);
  }

  //close modal
  closeModal(){
    this.$modal.style.visibility = "hidden";
    this.$modal.style.display = "block";
  }

  //return url to posted file
  getFileUrl(filename) {
    // create storage reference
    var storage = firebase.storage().ref(filename);
    //get file url
    storage.getDownloadURL().then(function (url) {
      app.imageUrl = url;

    }).catch(function (error) {
      console.log("error encountered");
      console.log(error);
    });
  }

  // add functionality to more options button
  addMoreOptions() {
    let elementsList = document.getElementsByClassName("options");
    for (let i = 0; i < elementsList.length; i++) {
      elementsList[i].addEventListener("click", (event) => {
        this.$modal.style.display = "block";
        this.$modal.style.visibility = "visible";
        this.clickedPostId = event.target.parentNode.id; // get id of clicked element/post
      });
    }

  }

  //get user posts
  getFeed() {
    {
      const docRef = db.collection("users").doc(this.userId);

      docRef.get().then((doc) => {
        if (doc.exists) {
          console.log("Document data:", doc.data());
          this.posts = doc.data().posts;
          this.displayFeed();
        } else {
          // doc.data() will be undefined in this case
          // add new user to database
          console.log("No such document!");
          db.collection("users").doc(this.userId).set({
            posts: []
          })
            .then(() => {
              console.log("User successfully created!");
            })
            .catch((error) => {
              console.log("Error writting document: ", error);
            });
        }
      }).catch((error) => {
        console.log("Error getting document:", error);
      });
    }
  }

  displayFeed() {

    document.getElementById("posts-id").innerHTML = this.posts.map((post) =>
      `<div class="post" id=${post.id}>
            <div class="header" id=${post.id}>
              <div class="profile-area">
                <div class="post-pic">
                  <img
                    alt="jayshetty's profile picture"
                    class="_6q-tv"
                    data-testid="user-avatar"
                    draggable="false"
                    src="./assets/akhil.png"
                  />
                </div>
                <span class="profile-name">jayshetty</span>
              </div>
              <div class="options" id=${post.id}>
                <div
                  class="Igw0E rBNOH YBx95 _4EzTm more-btn" 
                  id=${post.id}
                 
                  style="height: 24px; width: 24px; cursor:pointer;"
                >
                  <svg id=${post.id}
                    aria-label="More options"
                    class="_8-yf5"
                    fill="#262626"
                    height="16"
                    viewBox="0 0 48 48"
                    width="16"
                  >
                    <circle
                      clip-rule="evenodd"
                      cx="8"
                      cy="24"
                      fill-rule="evenodd"
                      r="4.5"
                    ></circle>
                    <circle
                      clip-rule="evenodd"
                      cx="24"
                      cy="24"
                      fill-rule="evenodd"
                      r="4.5"
                    ></circle>
                    <circle
                      clip-rule="evenodd"
                      cx="40"
                      cy="24"
                      fill-rule="evenodd"
                      r="4.5"
                    ></circle>
                  </svg>
                </div>
              </div>
            </div>
            <div class="body">
              <img
                alt="Photo by Jay Shetty on September 12, 2020. Image may contain: 2 people."
                class="FFVAD"
                decoding="auto"
                sizes="614px"
                src="${post.imageLink}"
                style="object-fit: cover"
              />
            </div>
            <div class="footer">
              <div class="user-actions">
                <div class="like-comment-share">
                  <div>
                    <span class=""
                      ><svg
                        aria-label="Like"
                        class="_8-yf5"
                        fill="#262626"
                        height="24"
                        viewBox="0 0 48 48"
                        width="24"
                      >
                        <path
                          d="M34.6 6.1c5.7 0 10.4 5.2 10.4 11.5 0 6.8-5.9 11-11.5 16S25 41.3 24 41.9c-1.1-.7-4.7-4-9.5-8.3-5.7-5-11.5-9.2-11.5-16C3 11.3 7.7 6.1 13.4 6.1c4.2 0 6.5 2 8.1 4.3 1.9 2.6 2.2 3.9 2.5 3.9.3 0 .6-1.3 2.5-3.9 1.6-2.3 3.9-4.3 8.1-4.3m0-3c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5.6 0 1.1-.2 1.6-.5 1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z"
                        ></path></svg
                    ></span>
                  </div>
                  <div class="margin-left-small">
                    <svg
                      aria-label="Comment"
                      class="_8-yf5"
                      fill="#262626"
                      height="24"
                      viewBox="0 0 48 48"
                      width="24"
                    >
                      <path
                        clip-rule="evenodd"
                        d="M47.5 46.1l-2.8-11c1.8-3.3 2.8-7.1 2.8-11.1C47.5 11 37 .5 24 .5S.5 11 .5 24 11 47.5 24 47.5c4 0 7.8-1 11.1-2.8l11 2.8c.8.2 1.6-.6 1.4-1.4zm-3-22.1c0 4-1 7-2.6 10-.2.4-.3.9-.2 1.4l2.1 8.4-8.3-2.1c-.5-.1-1-.1-1.4.2-1.8 1-5.2 2.6-10 2.6-11.4 0-20.6-9.2-20.6-20.5S12.7 3.5 24 3.5 44.5 12.7 44.5 24z"
                        fill-rule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <div class="margin-left-small">
                    <svg
                      aria-label="Share Post"
                      class="_8-yf5"
                      fill="#262626"
                      height="24"
                      viewBox="0 0 48 48"
                      width="24"
                    >
                      <path
                        d="M47.8 3.8c-.3-.5-.8-.8-1.3-.8h-45C.9 3.1.3 3.5.1 4S0 5.2.4 5.7l15.9 15.6 5.5 22.6c.1.6.6 1 1.2 1.1h.2c.5 0 1-.3 1.3-.7l23.2-39c.4-.4.4-1 .1-1.5zM5.2 6.1h35.5L18 18.7 5.2 6.1zm18.7 33.6l-4.4-18.4L42.4 8.6 23.9 39.7z"
                      ></path>
                    </svg>
                  </div>
                </div>
                <div class="bookmark">
                  <div class="QBdPU rrUvL">
                    <svg
                      aria-label="Save"
                      class="_8-yf5"
                      fill="#262626"
                      height="24"
                      viewBox="0 0 48 48"
                      width="24"
                    >
                      <path
                        d="M43.5 48c-.4 0-.8-.2-1.1-.4L24 29 5.6 47.6c-.4.4-1.1.6-1.6.3-.6-.2-1-.8-1-1.4v-45C3 .7 3.7 0 4.5 0h39c.8 0 1.5.7 1.5 1.5v45c0 .6-.4 1.2-.9 1.4-.2.1-.4.1-.6.1zM24 26c.8 0 1.6.3 2.2.9l15.8 16V3H6v39.9l15.8-16c.6-.6 1.4-.9 2.2-.9z"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>
              <span class="likes"
                >Liked by <b>ishitaaaa.b</b> and <b>others</b></span
              >
              <span class="caption">
                <span class="caption-username"><b>jayshetty</b></span>
                <span class="caption-text">
                ${post.caption}  
                </span
                >
              </span>
              <span class="comment">
                <span class="caption-username"><b>akhilboddu</b></span>
                <span class="caption-text">Thank you</span>
              </span>
              <span class="comment">
                <span class="caption-username"><b>imharjot</b></span>
                <span class="caption-text"> Great stuff</span>
              </span>
              <span class="posted-time">5 HOURS AGO</span>
            </div>
            <div class="add-comment">
              <input type="text" placeholder="Add a comment..." />
              <a class="post-btn">Post</a>
            </div>
          </div>`
    ).join("");
    this.addMoreOptions(); // add functionality to more options button
  }

  //retrieve post from array
  getPost(target){
    for (let i = 0; i < this.posts.length; i++){
      if (this.posts[i].id === target){
        return {postObj:this.posts[i], index:i};
      }
        
    }
  }

  editPost(target){

    const post = this.getPost(target);
    this.state = 1; // change state value to 1 
    console.log(post)
    this.index = post.index;
    this.createPost();
    document.querySelector("#post-caption").value = post.postObj.caption;
  }

  follow(user){
    //add user to people current user follows
    this.following.push(user);
  }
}

const app = new App();