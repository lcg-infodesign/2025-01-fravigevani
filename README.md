[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/jr6G_noe)
# Assignment 1 dataset
Dataset for the first assignment of the course


Each student should use ITS OWN dataset, DO NOT use someone’s else file, search for the folder that has your GitHub username.

The goal is the following:
* Parse the file, find the valid rows (i.e., the rows for which both rules are satisfied, as described below).
*  Create a GitHub page that displays using p5.js the following information:
    * Mean of the first column (https://en.wikipedia.org/wiki/Mean)
    * Standard deviation of the second column (https://en.wikipedia.org/wiki/Standard_deviation)
    * Mode of the third column (https://en.wikipedia.org/wiki/Mode_(statistics))
    * Median of the fourth column (https://en.wikipedia.org/wiki/Median)
    * Mean and standard deviation of the fifth column

You must provide two graphical and two textual representations. You can decide which information is shown in which modality. The fifth and final representation is up to you. For example, as a graphical representation, you could plot a circle whose size depends on the mean of the first column.

To identify the valid rows of the dataset:
Read the rules that are written in the rules.txt file (again, each student will have ITS OWN rules.txt file!)
A row is considered valid if both rules are valid at the same time.

Example:
1. rule1 -> column0 > 0
2. rule2 -> column1 < -5

* 5,-2,1,2,3 is a valid row since both rules are valid
* -1,-1,3,4,5 is not a valid row since column0 is negative and thus rule1 is not satisfied.
* 5,1,4,5,7 is not a valid row since column1 is greater than 0 and thus rule2 is not satisfied.
* -2,3,9,0,1 is not a valid row since neither of the rules are satisfied.  
