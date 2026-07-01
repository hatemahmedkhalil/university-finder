import {
  List, Datagrid, TextField, BooleanField, NumberField, DateField,
  Edit, Create, SimpleForm, TextInput, BooleanInput, NumberInput,
  Show, SimpleShowLayout, required,
} from "react-admin";

const SECTION_NAMES = [
  { id: "Listening", name: "🎧 Listening" },
  { id: "Reading",   name: "📖 Reading"   },
  { id: "Writing",   name: "✍️ Writing"   },
  { id: "Speaking",  name: "🎤 Speaking"  },
];

const QUESTION_TYPES = [
  { id: "multiple_choice", name: "Multiple Choice"  },
  { id: "true_false",      name: "True / False"     },
  { id: "short_answer",    name: "Short Answer"     },
  { id: "essay",           name: "Essay"            },
  { id: "matching",        name: "Matching"         },
];

/* ── IELTS Tests ── */

export const IeltsTestList = () => (
  <List sort={{ field: "id", order: "DESC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField    source="id"              label="ID" />
      <TextField    source="title"           label="Title" />
      <NumberField  source="duration_minutes" label="Duration (min)" />
      <NumberField  source="section_count"   label="Sections" />
      <NumberField  source="total_questions" label="Questions" />
      <BooleanField source="is_published"    label="Published" />
      <DateField    source="created_at"      label="Created" showTime />
    </Datagrid>
  </List>
);

export const IeltsTestCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput   source="title"            validate={required()} fullWidth />
      <TextInput   source="description"      multiline rows={3} fullWidth />
      <NumberInput source="duration_minutes" label="Duration (minutes)" defaultValue={170} />
      <BooleanInput source="is_published"   label="Published (visible to students)" />
    </SimpleForm>
  </Create>
);

export const IeltsTestEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput   source="title"            validate={required()} fullWidth />
      <TextInput   source="description"      multiline rows={3} fullWidth />
      <NumberInput source="duration_minutes" label="Duration (minutes)" />
      <BooleanInput source="is_published"   label="Published (visible to students)" />
    </SimpleForm>
  </Edit>
);

export const IeltsTestShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField    source="id" />
      <TextField    source="title" />
      <TextField    source="description" />
      <NumberField  source="duration_minutes" label="Duration (minutes)" />
      <NumberField  source="section_count"   label="Sections" />
      <NumberField  source="total_questions" label="Total Questions" />
      <BooleanField source="is_published" />
      <DateField    source="created_at" showTime />
    </SimpleShowLayout>
  </Show>
);

/* ── IELTS Sections ── */

export const IeltsSectionList = () => (
  <List sort={{ field: "order_index", order: "ASC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField   source="id"             label="ID" />
      <NumberField source="test_id"        label="Test ID" />
      <TextField   source="name"           label="Section" />
      <NumberField source="order_index"    label="Order" />
      <NumberField source="question_count" label="Questions" />
    </Datagrid>
  </List>
);

export const IeltsSectionCreate = () => (
  <Create>
    <SimpleForm>
      <NumberInput source="test_id"      label="Test ID" validate={required()} />
      <TextInput   source="name"         label="Section Name (e.g. Listening)" validate={required()} fullWidth />
      <TextInput   source="instructions" multiline rows={3} fullWidth />
      <NumberInput source="order_index"  defaultValue={0} />
    </SimpleForm>
  </Create>
);

export const IeltsSectionEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput   source="name"         validate={required()} fullWidth />
      <TextInput   source="instructions" multiline rows={3} fullWidth />
      <NumberInput source="order_index" />
    </SimpleForm>
  </Edit>
);

export const IeltsSectionShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField   source="id" />
      <NumberField source="test_id" label="Test ID" />
      <TextField   source="name" />
      <TextField   source="instructions" />
      <NumberField source="order_index" />
      <NumberField source="question_count" />
    </SimpleShowLayout>
  </Show>
);

/* ── IELTS Questions ── */

export const IeltsQuestionList = () => (
  <List sort={{ field: "order_index", order: "ASC" }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField   source="id"            label="ID" />
      <NumberField source="section_id"    label="Section ID" />
      <TextField   source="question_type" label="Type" />
      <NumberField source="marks"         label="Marks" />
      <NumberField source="order_index"   label="Order" />
    </Datagrid>
  </List>
);

export const IeltsQuestionCreate = () => (
  <Create>
    <SimpleForm>
      <NumberInput source="section_id"    label="Section ID" validate={required()} />
      <TextInput   source="question_text" label="Question" validate={required()} multiline rows={3} fullWidth />
      <TextInput   source="question_type" label="Type (multiple_choice / true_false / short_answer / essay / matching)" fullWidth defaultValue="multiple_choice" />
      <TextInput   source="options_json"  label='Options JSON (e.g. ["A","B","C","D"])' fullWidth />
      <TextInput   source="correct_answer" fullWidth />
      <NumberInput source="marks"         defaultValue={1} />
      <NumberInput source="order_index"   defaultValue={0} />
    </SimpleForm>
  </Create>
);

export const IeltsQuestionEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput   source="question_text" validate={required()} multiline rows={3} fullWidth />
      <TextInput   source="question_type" fullWidth />
      <TextInput   source="options_json"  label='Options JSON (e.g. ["A","B","C","D"])' fullWidth />
      <TextInput   source="correct_answer" fullWidth />
      <NumberInput source="marks" />
      <NumberInput source="order_index" />
    </SimpleForm>
  </Edit>
);

export const IeltsQuestionShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField   source="id" />
      <NumberField source="section_id" />
      <TextField   source="question_text" />
      <TextField   source="question_type" />
      <TextField   source="options_json" />
      <TextField   source="correct_answer" />
      <NumberField source="marks" />
      <NumberField source="order_index" />
    </SimpleShowLayout>
  </Show>
);
