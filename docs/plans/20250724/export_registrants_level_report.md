# Goal

Add a registrants-level export to the registration-manager report page:
- Export each individual registrant's data, not just registration-level data.
- Include user roles and team info for each registrant.
- If `event_role_id` is null, display "participant".
- If `event_role_id` is not null, display the role and team.
- Allow registration manager to create/export a report by `team_name`, including registrant's information and roles.

# Todo List

```markdown
- [ ] Step 1: Update the API endpoint to support registrants-level export, joining `registrants` with `event_roles` and including `team_name` and `role name` for each registrant.
- [ ] Step 2: Update the frontend to allow switching between registration-level and registrants-level export.
- [ ] Step 3: Update the export logic to generate CSV/Excel with registrants-level data, including all relevant fields.
- [ ] Step 4: Add UI controls to filter/export by `team_name`, including roles, at the registrant level.
- [ ] Step 5: Integrate SheetJS (xlsx) and/or PapaParse for robust CSV/Excel export if not already done.
- [ ] Step 6: Test the registrants-level export for edge cases (no role, multiple teams, missing data).
- [ ] Step 7: Review and refactor for performance and maintainability.
- [ ] Step 8: Validate with sample data and ensure all requirements are met.
```
