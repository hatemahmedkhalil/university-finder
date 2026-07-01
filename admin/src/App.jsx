import { MemoryRouter } from "react-router-dom";
import { Admin, Resource } from "react-admin";
import SchoolIcon from "@mui/icons-material/School";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import PeopleIcon from "@mui/icons-material/People";
import QuizIcon from "@mui/icons-material/Quiz";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import PersonIcon from "@mui/icons-material/Person";
import CampaignIcon from "@mui/icons-material/Campaign";
import AssignmentIcon from "@mui/icons-material/Assignment";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

import authProvider from "./authProvider";
import dataProvider from "./dataProvider";
import Dashboard from "./Dashboard";
import InstructorDashboard from "./InstructorDashboard";
import SupportPanel from "./resources/Support";

import {
  UniversityList,
  UniversityEdit,
  UniversityCreate,
  UniversityShow,
} from "./resources/Universities";

import {
  ScholarshipList,
  ScholarshipEdit,
  ScholarshipCreate,
  ScholarshipShow,
} from "./resources/Scholarships";

import { UserList, UserShow } from "./resources/Users";

import {
  InstructorList, InstructorEdit, InstructorCreate, InstructorShow,
} from "./resources/Instructors";

import {
  AnnouncementList, AnnouncementEdit, AnnouncementCreate, AnnouncementShow,
} from "./resources/Announcements";

import { ApplicationList, ApplicationCreate, ApplicationEdit, ApplicationShow } from "./resources/Applications";
import { InstructorMessageList, InstructorMessageShow } from "./resources/InstructorMessages";

import {
  PlacementTestList,
  PlacementTestEdit,
  PlacementTestCreate,
  PlacementTestShow,
  CourseList,
  CourseEdit,
  CourseCreate,
  CourseShow,
} from "./resources/Learning";

import {
  IeltsTestList, IeltsTestCreate, IeltsTestEdit, IeltsTestShow,
  IeltsSectionList, IeltsSectionCreate, IeltsSectionEdit, IeltsSectionShow,
  IeltsQuestionList, IeltsQuestionCreate, IeltsQuestionEdit, IeltsQuestionShow,
} from "./resources/Ielts";

import { PipelineList } from "./resources/Pipeline";

import { Layout, Menu, CustomRoutes } from "react-admin";
import { usePermissions } from "react-admin";
import { Route } from "react-router-dom";

/* Sidebar that hides all items for instructors */
const AppMenu = () => {
  const { permissions } = usePermissions();
  if (permissions === "instructor") return <Menu><Menu.DashboardItem /></Menu>;
  return (
    <Menu>
      <Menu.DashboardItem />
      <Menu.ResourceItems />
      <Menu.Item to="/support-tickets" primaryText="Support" leftIcon={<SupportAgentIcon />} />
    </Menu>
  );
};

const AppLayout = (props) => <Layout {...props} menu={AppMenu} />;

const App = () => (
  <MemoryRouter>
  <Admin
    title="University Finder Admin"
    dashboard={localStorage.getItem("user_role") === "instructor" ? InstructorDashboard : Dashboard}
    authProvider={authProvider}
    dataProvider={dataProvider}
    layout={AppLayout}
  >
    {(permissions) => {
      /* Instructors only see the dashboard (InstructorDashboard is rendered there) */
      if (permissions === "instructor") {
        return [];
      }
      return [
        <Resource key="universities"
          name="universities"
          list={UniversityList} edit={UniversityEdit} create={UniversityCreate} show={UniversityShow}
          icon={SchoolIcon}
        />,
        <Resource key="scholarships"
          name="scholarships"
          list={ScholarshipList} edit={ScholarshipEdit} create={ScholarshipCreate} show={ScholarshipShow}
          icon={CardGiftcardIcon}
        />,
        <Resource key="users"
          name="users"
          list={UserList} show={UserShow}
          icon={PeopleIcon}
        />,
        <Resource key="announcements"
          name="announcements"
          list={AnnouncementList} edit={AnnouncementEdit} create={AnnouncementCreate} show={AnnouncementShow}
          icon={CampaignIcon} options={{ label: "Announcements" }}
        />,
        <Resource key="instructors"
          name="instructors"
          list={InstructorList} edit={InstructorEdit} create={InstructorCreate} show={InstructorShow}
          icon={PersonIcon} options={{ label: "Instructors" }}
        />,
        <Resource key="applications"
          name="applications"
          list={ApplicationList} create={ApplicationCreate} edit={ApplicationEdit} show={ApplicationShow}
          icon={AssignmentIcon} options={{ label: "Applications" }}
        />,
        <Resource key="pipeline-admin"
          name="pipeline/admin/all"
          list={PipelineList}
          icon={AssignmentIcon} options={{ label: "App. Pipeline" }}
        />,
        <Resource key="instructor-messages"
          name="instructor-messages"
          list={InstructorMessageList} show={InstructorMessageShow}
          icon={QuestionAnswerIcon} options={{ label: "Q&A Messages" }}
        />,
        <Resource key="placement-tests"
          name="learning/placement-tests"
          list={PlacementTestList} edit={PlacementTestEdit} create={PlacementTestCreate} show={PlacementTestShow}
          icon={QuizIcon} options={{ label: "Placement Tests" }}
        />,
        <Resource key="courses"
          name="learning/courses"
          list={CourseList} edit={CourseEdit} create={CourseCreate} show={CourseShow}
          icon={MenuBookIcon} options={{ label: "Courses" }}
        />,
        <Resource key="ielts-tests"
          name="ielts/manage"
          list={IeltsTestList} edit={IeltsTestEdit} create={IeltsTestCreate} show={IeltsTestShow}
          icon={SchoolOutlinedIcon} options={{ label: "IELTS Tests" }}
        />,
        <Resource key="ielts-sections"
          name="ielts/manage/sections"
          list={IeltsSectionList} edit={IeltsSectionEdit} create={IeltsSectionCreate} show={IeltsSectionShow}
          icon={SchoolOutlinedIcon} options={{ label: "IELTS Sections" }}
        />,
        <Resource key="ielts-questions"
          name="ielts/manage/questions"
          list={IeltsQuestionList} edit={IeltsQuestionEdit} create={IeltsQuestionCreate} show={IeltsQuestionShow}
          icon={SchoolOutlinedIcon} options={{ label: "IELTS Questions" }}
        />,
        <CustomRoutes key="custom">
          <Route path="/support-tickets" element={<SupportPanel />} />
        </CustomRoutes>,
      ];
    }}
  </Admin>
  </MemoryRouter>
);

export default App;
