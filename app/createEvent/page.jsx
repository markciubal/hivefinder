import "./page.css";
import Header from "../components/header/Header.jsx";


export default function Page() {
  return (
    <>
      <Header />
     <div className="page">
      <h1 className="title">Create Event</h1>

      <div className="form">

        <label>Event Title</label>
        <input placeholder="Event Title" />

        <label>Event Description</label>
        <input placeholder="Description of Event" />

        <label>Date & Time</label>
        <input placeholder="When" />

        <label>Location</label>
        <input placeholder="Where" />

        <label>Upload Picture</label>
        <div className="upload-box">
          <span className="upload-icon">⬆</span>
        </div>

        <label>Event Tags</label>
        <input placeholder="Tag the event to connect with users with similar interests" />

        <div className="tag-buttons">
          <button className="tag-btn">Fishing</button>
          <button className="tag-btn">Camping</button>
          <button className="tag-btn">Off-roading</button>
        </div>

        <button className="submit-btn">Submit</button>
      </div>
    </div>
    </>
  );
}
