const userLogin = (req, res, next) => {
    try {
      if (!req.session.user) {
        res.redirect("/login");
      } else if (req.session.user.role !== 'user') {
        res.status(403).send('Access Forbidden');
      } else {
        next();
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  
  const adminLogin = (req, res, next) => {
    try {
      if (!req.session.admin) {
        res.redirect("/admin");
      } else if (req.session.admin.role !== 'admin') {
        res.status(403).send('Access Forbidden');
      } else {
        next();
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  
  module.exports = { userLogin, adminLogin };
  