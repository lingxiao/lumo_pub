/**
 * @Package: navigation hoc
 * @Date   : Dec 15th, 2021
 * @Author : Xiao Ling   
 * @Documentation: https://v5.reactrouter.com/web/api/Hooks
 *
*/

import { useNavigate, useLocation } from "react-router-dom";

const withRouter = (WrappedComponent) => props => {

  const navigate = useNavigate();
  const location = useLocation();

  return (
    <WrappedComponent
      {...props}
      navigate={navigate}
      location={location}
    />
  );
};

export default withRouter