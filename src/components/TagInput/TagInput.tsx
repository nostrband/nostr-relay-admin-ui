import { ReactTags } from "react-tag-autocomplete";
import "./TagInput.css";
import { useCallback } from "react";

type tagType = {
  value: number;
  label: string;
};

const TagInput = ({
  tags,
  setTags,
  placeholder,
  suggestions,
  disabled,
  isAllowNew = true,
}: {
  tags: tagType[];
  setTags: (tags: tagType[]) => void;
  placeholder: string;
  suggestions: tagType[];
  disabled?: boolean;
  isAllowNew?: boolean;
}) => {
  const onDelete = useCallback(
    (tagIndex: number) => {
      setTags(tags.filter((_, i) => i !== tagIndex));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tags],
  );

  const onAdd = useCallback(
    (newTag: tagType) => {
      const newTagTrim = { ...newTag, label: newTag.label.replaceAll(" ", "") };
      setTags([...tags, newTagTrim]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tags],
  );

  return (
    <ReactTags
      isDisabled={disabled}
      delimiterKeys={[" ", "Enter"]}
      activateFirstOption
      allowNew={isAllowNew}
      placeholderText={placeholder}
      selected={tags}
      suggestions={suggestions}
      onAdd={onAdd}
      onDelete={onDelete}
      noOptionsText="No matching tags"
    />
  );
};

export default TagInput;
