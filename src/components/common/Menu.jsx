import React, { useRef,useEffect, useState } from "react";
import { NavLink,useNavigate} from "react-router-dom";
// import { AiOutlineMenu } from "react-icons/ai";
import logo from "../../assets/Logo/Logo-Full-Light.png";
import { RxCross1 } from "react-icons/rx";
import useOnClickOutside from "../../hooks/useOnClickOutside";
import { FaChevronDown } from "react-icons/fa";
import { useSelector,useDispatch } from "react-redux";
import { categories } from "../../services/apis"
import { apiConnector } from "../../services/apiconnector"
import { logout } from "../../services/operations/authAPI"
const Menu = ({open,setopen}) => {
  const ref = useRef(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { token } = useSelector((state) => state.auth)
  //const categories = useSelector((state) => state.viewCourse);
   //console.log(categories)
   const [subLinks, setSubLinks] = useState([])
   const [loading, setLoading] = useState(false)
   useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await apiConnector("GET", categories.CATEGORIES_API)
        setSubLinks(res.data.data)
      } catch (error) {
        console.log("Could not fetch Categories.", error)
      }
      setLoading(false)
    })()
  }, [])

  useOnClickOutside(ref, () => setopen(false));

  return (
    <div className="mr-1 lg:hidden text-white">
      {/* <AiOutlineMenu
        fontSize={24}
        fill="#AFB2BF"
        onClick={() => setOpen(!open)}
      /> */}
      <div
        id="slider"
        className={`absolute inset-0 bg-richblack-900 shadow-black shadow-2xl w-80 h-full text-[#b8b8b8] transition-all ease-in-out lg:hidden overflow-y-scroll z-[1000] ${
          open ? "translate-x-0" : "-translate-x-80"
        }`}
        ref={ref}
      >
        <div className="flex h-[3.8rem] items-center justify-between">
          <div className="flex text-base font-orbitron text-white items-center pl-4">
            <img src={logo} width="150" alt="Logo" />
          </div>
          <div className="p-4">
            <RxCross1 onClick={() => setopen(false)} />
          </div>
        </div>

        <NavLink to="/" onClick={() => setopen(false)}>
          <div className="p-3.5 flex items-center active:bg-richblack-500">
            Home
          </div>
        </NavLink>
        <div
          className="flex items-center justify-between active:bg-richblack-500"
          onClick={() => setCatalogOpen(!catalogOpen)}
        >
          <div className="p-3.5">Catalog</div>{" "}
          <FaChevronDown
            className={`${
              catalogOpen && "rotate-180"
            } transition-all ease-in-out mr-6`}
          />
        </div>
        <div>
          {!subLinks ? (
            <p className="text-center">Loading...</p>
          ) :  subLinks?.length ? (
            <div className={`h-0 transition-all ease-in-out ${catalogOpen && "h-fit"}`}>
              {subLinks
                ?.filter((subLinks) => subLinks?.courses?.length > 0)
                ?.sort((a, b) => {
                  return a.name.localeCompare(b.name);
                })
                ?.map((subLinks, i) => {
                  let subLinkRoute = `/catalog/${subLinks.name
                    .split(" ")
                    .join("-")
                    .toLowerCase()
                  }`;
                  return (
                    <NavLink
                      to={subLinkRoute}
                      className={`p-3.5 ml-8 flex items-center active:bg-richblack-500 h-[100%] ${!catalogOpen ? "text-[0px]" : "transition-all ease-in-out duration-300"}`}
                      onClick={() => setopen(false)}
                      key={i}
                    >
                      <p>{subLinks.name}</p>
                    </NavLink>
                  );
                })}
            </div>
          ) : (
            <p className="text-center">No Courses Found</p>
          )}
        </div>
        <NavLink to="/about" onClick={() => setopen(false)}>
          <div className="p-3.5 flex items-center active:bg-richblack-500">
            About
          </div>
        </NavLink>
        <NavLink to="/contact" onClick={() => setopen(false)}>
          <div className="p-3.5 flex items-center active:bg-richblack-500">
            Contact
          </div>
        </NavLink>
        <NavLink to={token ? "/dashboard/my-profile" : "/login"} onClick={() => setopen(false)}>
          <div className="p-3.5 flex items-center active:bg-richblack-500">
          {
            token ? "DashBoard" : "Login"
          }
          </div>
        </NavLink>
        <div>
            {
                !token ?  (<NavLink to={"/signup"}>
                <div className="p-3.5 flex items-center active:bg-richblack-500" onClick={() => setopen(false)} > Signup </div>
        </NavLink>) : (<p  className="p-3.5 flex items-center active:bg-richblack-500"  onClick={() => {
              dispatch(logout(navigate))
              setopen(!open)
            }}>
            Logout
        </p>) 
            }
        </div>
      </div>
    </div>
  );
};

export default Menu;