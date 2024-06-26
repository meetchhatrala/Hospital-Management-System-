import React from "react";

function PageHeader(props){
    return (
        <div className="admin-header">
            <h1>{props.heading} Menu</h1>
            <nav className="navigation">
                <button>Sign out</button>
            </nav>
        </div>
    )
}

export default PageHeader;