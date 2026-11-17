import { GROUP_TYPE_LABELS, type GroupDto } from '@famille/shared';

/** Cases à cocher des groupes ; envoie un champ « groupIds » par groupe coché. */
export function GroupCheckboxes({ groups, legend }: { groups: GroupDto[]; legend: string }) {
  if (groups.length === 0) return null;
  return (
    <fieldset className="checks">
      <legend className="field__label">{legend}</legend>
      {groups.map((group) => (
        <label key={group.id} className="checks__item">
          <input type="checkbox" name="groupIds" value={group.id} />
          {group.name} <span className="checks__type">· {GROUP_TYPE_LABELS[group.type]}</span>
        </label>
      ))}
    </fieldset>
  );
}
