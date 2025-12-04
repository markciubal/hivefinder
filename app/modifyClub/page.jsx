import "./page.css";
import Header from "../components/header/Header.jsx";


export default function Page() {
  return (
    <>
      <Header />
       <div className="modify-container">
      <div className="modify-card">

        <h1 className="modify-title">Modify Club Information</h1>

        {/* Email */}
        <label className="input-label">Email</label>
        <input className="input-field" placeholder="Enter Club Email" />

        {/* Website */}
        <label className="input-label">Website</label>
        <input className="input-field" placeholder="Enter Club Website" />

        {/* Description */}
        <label className="input-label">Description</label>
        <textarea
          className="textarea-field"
          placeholder="Describe club or add mission statement"
        />

        {/* Event Tags */}
        <label className="input-label">Event Tags</label>
        <input
          className="input-field"
          placeholder="Tag the event to connect with users with similar interests"
        />

        <div className="tags-row">
          <div className="tag-chip">Fishing</div>
          <div className="tag-chip">Camping</div>
          <div className="tag-chip">Off-roading</div>
        </div>

        <button className="submit-btn">Submit</button>
      </div>
    </div>
    </>
  );
}
