import { Admin, Resource } from "react-admin";
import SchoolIcon from "@mui/icons-material/School";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import PeopleIcon from "@mui/icons-material/People";

import authProvider from "./authProvider";
import dataProvider from "./dataProvider";
import Dashboard from "./Dashboard";

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

const App = () => (
  <Admin
    title="University Finder Admin"
    dashboard={Dashboard}
    authProvider={authProvider}
    dataProvider={dataProvider}
    basename="/admin"
  >
    <Resource
      name="universities"
      list={UniversityList}
      edit={UniversityEdit}
      create={UniversityCreate}
      show={UniversityShow}
      icon={SchoolIcon}
    />
    <Resource
      name="scholarships"
      list={ScholarshipList}
      edit={ScholarshipEdit}
      create={ScholarshipCreate}
      show={ScholarshipShow}
      icon={CardGiftcardIcon}
    />
    <Resource
      name="users"
      list={UserList}
      show={UserShow}
      icon={PeopleIcon}
    />
  </Admin>
);

export default App;
