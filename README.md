# Insurance premium predictor models written in python

## What you need installed
 - Python 3.8
 - Make (for running Makefile)
 - Python virvual environment
 
 ## Installing pre-requisites
  - first you need to create your virtual environment. It can be created like so in linux/Unix systems:
    - open the terminal and type the command and press enter: python3 -m venv venv
    - the virtual environment will be created and a folder named venv should appear in the folder you ran the above command
    - type  'make' and press enter to install the required libraries

## Running the programs
 - type 'make run1'  to run the first program and 'make run2' to run the second program.
 - once the training of either model is complete, the user will be prompted to enter feature values to make a prediction
 - The features are separated by a space and are in the following order "age sex bmi children smoker region" e.g. "28 0 36.9 2 1 2" for someone who is aged 28  and is male with a bmi of 36.9, 2 children, is a smoker and lives in Guateng:
   - input is encoded as follows for these words: {yes:1, no: 0, male:0, female:1, KZN:0, Western Cape:1, Gauteng:2, North-West:3}
 
 - model will return numerical value and it will be printed out
 - user can enter 'quit' to close the program


