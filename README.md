## Website Performance Optimization portfolio project


This is a website optimization project for **Udacity's Front End Developor Nanodegree Program**


### Project Goals
-----------
1. To achieve a PageSpeed score of **90** on **index.html** page
2. To have a consistent frame rate at **60fps** when scrolling in **pizza.html**
2. Time to resize pizzas is **less than 5ms** in **pizza.html** shown in the brower console

### Demo
-----------
To see the live demo, please go to 
[http://wengellen.github.io/perfmatters](https://wengellen.github.io/perfmatters)


### Code Optimization
-----------
### - views/js/main.js

1. **Debounce scroll event**: 
ensure updatePosition is only been queued once by using a requested flag along with requestanimationframe 
3. **Minimize DOM access**: Store the DOM Nodes into an array to hold references to the DOM elements, then use the forEach function to access each value in the array instead of the DOM
4. **Minimize DOM Layout property access**: 
 5. Move the reading of **scrollTop** layout property out of updatePostion() to avoid **Layout Threashing** issue 
 5. Replace the **style.left** with **style.transfom** so that only the Composite phase is triggered instead of Layout > Paint > Composite phases
6. Change from **querySelectorAll** to **getElementsByClassName**
7. Move **randomPizzas** variable declaration outside of the for loop in **resizePizzas()** to reduce DOM access

### - views/pizza.html

1. Move the **movingPizzas1** container to it's own row so that it can take up 100% of the background width on larger screen

### - views/css/main.css

1. **Promote background pizza images to its own layer**: Add **will-change**, **translateZ(0)**, and **backface-visibility:hidden** to the mover class

### How to Run the Project
----------

1. Check out the repository
1. Start a local server from "dist" folder

  ```bash
  $> cd /path/to/your-project-folder
  $> cd dist
  $> python -m SimpleHTTPServer 8080
  ```

1. Open a browser and visit localhost:8080


### How to Build the project
----------

1. Check out the repository
1. Run npm install

 ```
  $> npm install
 ```
1. Run grunt task

 ```
  $> grunt full
 ```
 
1. Run gulp task  

 ```
  $> gulp
 ```
 
1. Start a local server from "dist" folder

  ```bash
  $> cd /path/to/your-project-folder
  $> cd dist
  $> python -m SimpleHTTPServer 8080
  ```

1. Open a browser and visit localhost:8080


## Versions
Current version is v1. Future version will move the Crical task from Gulpfile into Gruntfile. Gulpfile will no longer be used then.


