import {
  List, Datagrid, TextField, BooleanField, NumberField, SelectField,
  Create, Edit, SimpleForm, TextInput, NumberInput, SelectInput,
  BooleanInput, ReferenceInput, required, Show, SimpleShowLayout,
} from "react-admin";

const EXAM_CHOICES = [
  { id: "toefl",    name: "TOEFL iBT" },
  { id: "cambridge", name: "Cambridge B2 First" },
];

const SECTION_CHOICES = [
  { id: "reading",   name: "Reading" },
  { id: "listening", name: "Listening" },
  { id: "writing",   name: "Writing" },
  { id: "speaking",  name: "Speaking" },
];

const QTYPE_CHOICES = [
  { id: "mcq",          name: "Multiple Choice" },
  { id: "essay",        name: "Essay" },
  { id: "short_answer", name: "Short Answer" },
];

/* ── Passages ── */

export const PassageList = () => (
  <List sort={{ field: "id", order: "DESC" }} filters={[
    <SelectInput source="exam_type" choices={EXAM_CHOICES} alwaysOn />,
  ]}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <SelectField source="exam_type" choices={EXAM_CHOICES} label="Exam" />
      <SelectField source="section"   choices={SECTION_CHOICES} />
      <TextField source="title" />
      <TextField source="difficulty" />
      <NumberField source="order_index" label="Order" />
      <BooleanField source="is_active" label="Active" />
    </Datagrid>
  </List>
);

const PassageForm = () => (
  <SimpleForm>
    <SelectInput source="exam_type" choices={EXAM_CHOICES} validate={required()} />
    <SelectInput source="section"   choices={SECTION_CHOICES} validate={required()} />
    <TextInput source="title" fullWidth />
    <TextInput source="content" multiline rows={10} fullWidth validate={required()} />
    <SelectInput source="difficulty" choices={[
      { id: "A2", name: "A2" }, { id: "B1", name: "B1" },
      { id: "B2", name: "B2" }, { id: "C1", name: "C1" }, { id: "C2", name: "C2" },
    ]} defaultValue="B2" />
    <NumberInput source="order_index" defaultValue={0} />
    <BooleanInput source="is_active" defaultValue={true} />
  </SimpleForm>
);

export const PassageCreate = () => <Create><PassageForm /></Create>;
export const PassageEdit   = () => <Edit><PassageForm /></Edit>;
export const PassageShow   = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="exam_type" />
      <TextField source="section" />
      <TextField source="title" />
      <TextField source="content" />
      <TextField source="difficulty" />
      <NumberField source="order_index" />
      <BooleanField source="is_active" />
    </SimpleShowLayout>
  </Show>
);

/* ── Questions ── */

export const QuestionList = () => (
  <List sort={{ field: "id", order: "DESC" }} filters={[
    <SelectInput source="exam_type" choices={EXAM_CHOICES} alwaysOn />,
    <SelectInput source="section"   choices={SECTION_CHOICES} alwaysOn />,
  ]}>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <SelectField source="exam_type" choices={EXAM_CHOICES} label="Exam" />
      <SelectField source="section"   choices={SECTION_CHOICES} />
      <TextField source="subsection" />
      <SelectField source="question_type" choices={QTYPE_CHOICES} label="Type" />
      <NumberField source="passage_id" label="Passage" />
      <TextField source="question_text" label="Question (preview)" />
      <TextField source="correct_answer" label="Answer" />
      <NumberField source="points" />
      <NumberField source="order_index" label="Order" />
      <BooleanField source="is_active" label="Active" />
    </Datagrid>
  </List>
);

const QuestionForm = () => (
  <SimpleForm>
    <SelectInput source="exam_type"     choices={EXAM_CHOICES}   validate={required()} />
    <SelectInput source="section"       choices={SECTION_CHOICES} validate={required()} />
    <TextInput   source="subsection"    label="Subsection (task1, task2, part1…)" />
    <SelectInput source="question_type" choices={QTYPE_CHOICES}   validate={required()} />
    <NumberInput source="passage_id"    label="Passage ID (optional, for reading/listening)" />
    <TextInput   source="question_text" multiline rows={5} fullWidth validate={required()} />
    <TextInput   source="options_json"  label='Options JSON (e.g. ["A) opt1","B) opt2","C) opt3","D) opt4"])' fullWidth />
    <TextInput   source="correct_answer" label="Correct Answer (A/B/C/D for MCQ)" />
    <TextInput   source="explanation"    multiline fullWidth />
    <NumberInput source="points"         defaultValue={1.0} />
    <NumberInput source="order_index"    defaultValue={0} />
    <BooleanInput source="is_active"     defaultValue={true} />
  </SimpleForm>
);

export const QuestionCreate = () => <Create><QuestionForm /></Create>;
export const QuestionEdit   = () => <Edit><QuestionForm /></Edit>;
export const QuestionShow   = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="exam_type" />
      <TextField source="section" />
      <TextField source="question_type" />
      <TextField source="passage_id" />
      <TextField source="question_text" />
      <TextField source="options_json" />
      <TextField source="correct_answer" />
      <NumberField source="points" />
      <BooleanField source="is_active" />
    </SimpleShowLayout>
  </Show>
);
