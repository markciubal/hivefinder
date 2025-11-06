import "./page.css";
import Header from "../components/header/Header.jsx";


export default function Page() {
  return (
    <>
      <Header />
      <div className="hero-form">
        <div className="text-content-title">
          <p className="text-7">Edit Account Details</p>
          <p className="text-9">How others see your account:</p>
        </div>

        <div className="form-contact">
          <div className="input-field">
            <p className="text-3">Name</p>
          <input id="firstname" firstname="firstname" className="input" placeholder="Your First Name" />
          
          </div>

          <div className="input-field">
            <p className="text-5">Last Name</p>
           <input id="lastname" lastname="lastname" className="input" placeholder="Your Last Name"/>
          </div>

          <div className="input-field">
            <p className="text-7">Email</p>
            <input id="email" email="email" className="input" placeholder="Your Email"/>
          </div>

          <div className="textarea-field">
            <p className="text-9">About Me</p>
            <input id="aboutme" aboutme="aboutme" className="input" placeholder="Describe Yourself"/>
          </div>

          <div className="button-group">
            <button className="button">
              <p className="text-1-1">Submit</p>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
