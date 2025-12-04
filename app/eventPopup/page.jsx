
import "./page.css";
export default function Page() {
  return (
    <>
      <div className="event-popup">

      <p className="club-name">Club Name</p>
      <h1 className="event-title">Event Name</h1>

      <p className="location">Location</p>
      <p className="datetime">Date & time</p>

      <img
        src="/eventpic.jpeg"
        className="event-image"
        alt="event food"
      />

      <p className="event-description">
        Event Description: Allied Students for Justice (ASFJ) is an inclusive
        platform designed to empower students and promote social justice at
        California State University, Sacramento (CSUS). ASFJ's platform aims to
        inspire, educate, and mobilize individuals towards creating a more
        equitable society.
      </p>

      <div className="action-row">
        <button className="interest-btn">I’m Interested!</button>
        <img src="/notif.svg" className="bell-icon" />
      </div>
    </div>

    </>
  );
}