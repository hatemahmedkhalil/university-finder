import { MemoryRouter } from "react-router-dom";
import { Admin, Resource } from "react-admin";
import SchoolIcon          from "@mui/icons-material/School";
import CardGiftcardIcon    from "@mui/icons-material/CardGiftcard";
import PeopleIcon          from "@mui/icons-material/People";
import PersonIcon          from "@mui/icons-material/Person";
import QuizIcon            from "@mui/icons-material/Quiz";
import MenuBookIcon        from "@mui/icons-material/MenuBook";
import SchoolOutlinedIcon  from "@mui/icons-material/SchoolOutlined";
import CampaignIcon        from "@mui/icons-material/Campaign";
import AssignmentIcon      from "@mui/icons-material/Assignment";
import QuestionAnswerIcon  from "@mui/icons-material/QuestionAnswer";
import SupportAgentIcon    from "@mui/icons-material/SupportAgent";
import NotificationsIcon   from "@mui/icons-material/Notifications";
import SendIcon            from "@mui/icons-material/Send";
import SchoolRoundedIcon   from "@mui/icons-material/SchoolRounded";
import ArticleIcon         from "@mui/icons-material/Article";

import authProvider from "./authProvider";
import dataProvider from "./dataProvider";
import Dashboard from "./Dashboard";
import InstructorDashboard from "./InstructorDashboard";
import SupportPanel from "./resources/Support";

import { UniversityList, UniversityEdit, UniversityCreate, UniversityShow } from "./resources/Universities";
import { ScholarshipList, ScholarshipEdit, ScholarshipCreate, ScholarshipShow } from "./resources/Scholarships";
import { UserList, UserEdit, UserShow } from "./resources/Users";
import { InstructorList, InstructorEdit, InstructorCreate, InstructorShow } from "./resources/Instructors";
import { AnnouncementList, AnnouncementEdit, AnnouncementCreate, AnnouncementShow } from "./resources/Announcements";
import { ApplicationList, ApplicationCreate, ApplicationEdit, ApplicationShow } from "./resources/Applications";
import { InstructorMessageList, InstructorMessageShow } from "./resources/InstructorMessages";
import { PlacementTestList, PlacementTestEdit, PlacementTestCreate, PlacementTestShow, CourseList, CourseEdit, CourseCreate, CourseShow } from "./resources/Learning";
import { IeltsTestList, IeltsTestCreate, IeltsTestEdit, IeltsTestShow, IeltsSectionList, IeltsSectionCreate, IeltsSectionEdit, IeltsSectionShow, IeltsQuestionList, IeltsQuestionCreate, IeltsQuestionEdit, IeltsQuestionShow } from "./resources/Ielts";
import { PipelineList } from "./resources/Pipeline";
import { PassageList, PassageCreate, PassageEdit, PassageShow, QuestionList, QuestionCreate, QuestionEdit, QuestionShow } from "./resources/Simulators";
import { StudentList, StudentShow, StudentEdit } from "./resources/Students";
import { NotificationList, SendNotificationPanel } from "./resources/Notifications";

import { Layout, Menu, CustomRoutes } from "react-admin";
import { usePermissions } from "react-admin";
import { Route } from "react-router-dom";

const AppMenu = () => {
  const { permissions } = usePermissions();
  if (permissions === "instructor") return <Menu><Menu.DashboardItem /></Menu>;
  return (
    <Menu>
      <Menu.DashboardItem />

      {/* ── Content ── */}
      <Menu.Item to="/universities"   primaryText="Universities"     leftIcon={<SchoolIcon />} />
      <Menu.Item to="/scholarships"   primaryText="Scholarships"     leftIcon={<CardGiftcardIcon />} />
      <Menu.Item to="/announcements"  primaryText="Announcements"    leftIcon={<CampaignIcon />} />

      {/* ── People ── */}
      <Menu.Item to="/admin/users"    primaryText="Users"            leftIcon={<PeopleIcon />} />
      <Menu.Item to="/admin/students" primaryText="Students"         leftIcon={<SchoolRoundedIcon />} />
      <Menu.Item to="/instructors"    primaryText="Instructors"      leftIcon={<PersonIcon />} />

      {/* ── Applications ── */}
      <Menu.Item to="/applications"        primaryText="Applications"   leftIcon={<AssignmentIcon />} />
      <Menu.Item to="/pipeline/admin/all"  primaryText="App. Pipeline"  leftIcon={<AssignmentIcon />} />

      {/* ── Community ── */}
      <Menu.Item to="/instructor-messages" primaryText="Q&A Messages"   leftIcon={<QuestionAnswerIcon />} />
      <Menu.Item to="/support-tickets"     primaryText="Support"         leftIcon={<SupportAgentIcon />} />

      {/* ── Notifications ── */}
      <Menu.Item to="/admin/notifications" primaryText="Notifications"   leftIcon={<NotificationsIcon />} />
      <Menu.Item to="/send-notification"   primaryText="Send Notification" leftIcon={<SendIcon />} />

      {/* ── Learning ── */}
      <Menu.Item to="/learning/placement-tests" primaryText="Placement Tests" leftIcon={<QuizIcon />} />
      <Menu.Item to="/learning/courses"          primaryText="Courses"         leftIcon={<MenuBookIcon />} />
      <Menu.Item to="/ielts/manage"              primaryText="IELTS Tests"     leftIcon={<SchoolOutlinedIcon />} />
      <Menu.Item to="/ielts/manage/sections"     primaryText="IELTS Sections"  leftIcon={<SchoolOutlinedIcon />} />
      <Menu.Item to="/ielts/manage/questions"    primaryText="IELTS Questions" leftIcon={<SchoolOutlinedIcon />} />
      <Menu.Item to="/simulators/admin/passages"  primaryText="Exam Passages"   leftIcon={<ArticleIcon />} />
      <Menu.Item to="/simulators/admin/questions" primaryText="Exam Questions"  leftIcon={<ArticleIcon />} />
    </Menu>
  );
};

const AppLayout = (props) => <Layout {...props} menu={AppMenu} />;

const App = () => (
  <MemoryRouter>
  <Admin
    title="UniPath Admin"
    dashboard={localStorage.getItem("user_role") === "instructor" ? InstructorDashboard : Dashboard}
    authProvider={authProvider}
    dataProvider={dataProvider}
    layout={AppLayout}
  >
    {(permissions) => {
      if (permissions === "instructor") return [];
      return [
        /* ── Content ── */
        <Resource key="universities"  name="universities"  list={UniversityList}  edit={UniversityEdit}  create={UniversityCreate}  show={UniversityShow}  icon={SchoolIcon} />,
        <Resource key="scholarships"  name="scholarships"  list={ScholarshipList} edit={ScholarshipEdit} create={ScholarshipCreate} show={ScholarshipShow} icon={CardGiftcardIcon} />,
        <Resource key="announcements" name="announcements" list={AnnouncementList} edit={AnnouncementEdit} create={AnnouncementCreate} show={AnnouncementShow} icon={CampaignIcon} options={{ label: "Announcements" }} />,

        /* ── People ── */
        <Resource key="admin-users"    name="admin/users"    list={UserList}      edit={UserEdit}    show={UserShow}    icon={PeopleIcon}          options={{ label: "Users" }} />,
        <Resource key="admin-students" name="admin/students" list={StudentList}   show={StudentShow} edit={StudentEdit} icon={SchoolRoundedIcon}   options={{ label: "Students" }} />,
        <Resource key="instructors"    name="instructors"    list={InstructorList} edit={InstructorEdit} create={InstructorCreate} show={InstructorShow} icon={PersonIcon} options={{ label: "Instructors" }} />,

        /* ── Applications ── */
        <Resource key="applications"   name="applications"        list={ApplicationList}  create={ApplicationCreate} edit={ApplicationEdit} show={ApplicationShow} icon={AssignmentIcon} options={{ label: "Applications" }} />,
        <Resource key="pipeline-admin" name="pipeline/admin/all"  list={PipelineList}     icon={AssignmentIcon} options={{ label: "App. Pipeline" }} />,

        /* ── Community ── */
        <Resource key="instructor-messages" name="instructor-messages" list={InstructorMessageList} show={InstructorMessageShow} icon={QuestionAnswerIcon} options={{ label: "Q&A Messages" }} />,

        /* ── Notifications ── */
        <Resource key="admin-notifications" name="admin/notifications" list={NotificationList} icon={NotificationsIcon} options={{ label: "Notifications" }} />,

        /* ── Learning ── */
        <Resource key="placement-tests" name="learning/placement-tests" list={PlacementTestList} edit={PlacementTestEdit} create={PlacementTestCreate} show={PlacementTestShow} icon={QuizIcon} options={{ label: "Placement Tests" }} />,
        <Resource key="courses"         name="learning/courses"          list={CourseList}       edit={CourseEdit}       create={CourseCreate}       show={CourseShow}       icon={MenuBookIcon} options={{ label: "Courses" }} />,
        <Resource key="ielts-tests"     name="ielts/manage"              list={IeltsTestList}    edit={IeltsTestEdit}    create={IeltsTestCreate}    show={IeltsTestShow}    icon={SchoolOutlinedIcon} options={{ label: "IELTS Tests" }} />,
        <Resource key="ielts-sections"  name="ielts/manage/sections"     list={IeltsSectionList} edit={IeltsSectionEdit} create={IeltsSectionCreate} show={IeltsSectionShow} icon={SchoolOutlinedIcon} options={{ label: "IELTS Sections" }} />,
        <Resource key="ielts-questions"     name="ielts/manage/questions"      list={IeltsQuestionList} edit={IeltsQuestionEdit} create={IeltsQuestionCreate} show={IeltsQuestionShow} icon={SchoolOutlinedIcon} options={{ label: "IELTS Questions" }} />,
        <Resource key="sim-passages"         name="simulators/admin/passages"   list={PassageList}  create={PassageCreate}  edit={PassageEdit}  show={PassageShow}  icon={ArticleIcon} options={{ label: "Exam Passages" }} />,
        <Resource key="sim-questions"        name="simulators/admin/questions"  list={QuestionList} create={QuestionCreate} edit={QuestionEdit} show={QuestionShow} icon={ArticleIcon} options={{ label: "Exam Questions" }} />,

        <CustomRoutes key="custom">
          <Route path="/support-tickets"    element={<SupportPanel />} />
          <Route path="/send-notification"  element={<SendNotificationPanel />} />
        </CustomRoutes>,
      ];
    }}
  </Admin>
  </MemoryRouter>
);

export default App;
