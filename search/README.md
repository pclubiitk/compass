# Student Search IITK ~ Inside Nexus

This is a subtree for easy development of IITK Nexus. Refer [here](https://www.atlassian.com/git/tutorials/git-subtree) to learn more about git subtree.

## How the subtree was connected:
```
# Add the Student Search repo as remote
git remote add search https://github.com/pclubiitk/student-search-new.git

# Add the v2 branch as the subtree, via compressing the git history in one commit
git subtree add --prefix search search v2 --squash

```

More reference for student-search-new can be found [here](https://github.com/pclubiitk/student-search-new.git) it was a remake of the original Student Search (located [here](https://github.com/pclubiitk/student-search)) in Next.js, earlier student data was stored in a MongoDB Atlas cluster but due to the orders from the institute to adhere Indian government laws. Now the system is a part of IITK Nexus which combines multiple applications into a campus ecosystem for students and faculty.

Credits:
Programming Club IIT Kanpur