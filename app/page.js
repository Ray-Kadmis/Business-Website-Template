import AppointmentForm from "./AppointmentForm";
import Hero from "./Hero";
import Services from "./services";
import Questions from "./Questions";
import Testimonials from "./testimonials";
import Workers from "./Workers";
import Partners from "./partners";
import FireConfig from "./firebaseConfig";
import Blogs from "./blogs";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;
import Auth from "./Authformtoggler";
import LoginForm from "./login.js";
import SignUpForm from "./signup";
// import { db, auth, analytics } from "../path/to/firebase";

export default function Home() {
  return (
    <div>
      <Hero></Hero>
      <Services></Services>
      <Testimonials></Testimonials>
      <Workers></Workers>
      <AppointmentForm></AppointmentForm>
      <Partners></Partners>
      <Blogs></Blogs>
      <Questions></Questions>
    </div>
  );
}
