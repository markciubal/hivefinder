import "./page.css";
import Header from "../components/header/Header.jsx";

export default function Page() {
  return (
    <>
      <Header />

      <div className="manageclubscomp">

        <div className="hero-form">
          <div className="text-content-title">
            <p className="text-1">Manage Clubs</p>
            <p className="text-2">View your memberships here:</p>
          </div>
        </div>

        {/* ---------- Edit Your Clubs ------------- */}
        <p className="section-title">Edit your Clubs:</p>

        <div className="table">
          <div className="table-row table-header">
            <p>Club Name</p>
            <p>Role</p>
            <p>Manage</p>
            <p>Club Page</p>
          </div>

          <div className="table-row">
            <p>Hornet Aerospace</p>
            <p>Club Admin</p>
            <div className="icon-group">
              <img src="/edit.webp" />
              <img src="/delete.png" />
            </div>
            <button className="view-btn">View</button>
          </div>

          <div className="table-row">
            <p>Hornet Racing</p>
            <p>Club Admin</p>
            <div className="icon-group">
              <img src="/edit.webp" />
              <img src="/delete.png" />

              
            </div>
            <button className="view-btn">View</button>
          </div>
        </div>

        {/* -------- View memberships ------- */}
        <p className="section-title">View your Memberships:</p>

        <div className="table">
          <div className="table-row table-header">
            <p>Club Name</p>
            <p>Role</p>
            <p>Manage</p>
            <p>Club Page</p>
          </div>

          <div className="table-row">
            <p>Girls Who Code</p>
            <p>General Member</p>
            <img className="delete-icon" src="/delete.png" />
            <button className="view-btn">View</button>
          </div>

          <div className="table-row">
            <p>Society of Women Engineers</p>
            <p>General Member</p>
            <img className="delete-icon" src="/delete.png" />
            <button className="view-btn">View</button>
          </div>
        </div>
      </div>
    </>
  );
}
