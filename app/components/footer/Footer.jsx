import React from "react";

function Footer() {
    return (
        <div className="footer-container columns-2 bg-white text-black text-center p-4 mt-8">
            <div>
                <p className="text-sm">Location</p>
                <p className="text-xs">
                    CSU Sacramento
                    <br />
                    6000 J St
                    <br />
                    Sacramento, CA 95819
                </p>
            </div>
            <div>
                <p className="text-sm">Need help? Contact us!</p>
                <p className="text-xs">
                    <a href="mailto:support@hivefinder.com">support@hivefinder.com</a>
                </p>
            </div>
        </div>
    );
}

export default Footer;
