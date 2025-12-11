import Sidebar from "../../components/Sidebar/Sidebar";
import "./AppLandingContainer.scss";

interface AppLandingContainerProps {
  children?: React.ReactNode;
}

const AppLandingContainer = ({ children }: AppLandingContainerProps) => {
  return (
    <div className="sidebar-layout">
      <div className="topics-sidebar">
        <Sidebar />
      </div>

      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default AppLandingContainer;
