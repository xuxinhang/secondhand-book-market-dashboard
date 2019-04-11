import React from 'react';
import { Tag } from 'antd';
const { CheckableTag } = Tag;

export default function TagSelector (props) {
  const tagList = props.tags;
  const singleMode = props.single;
  const selectedTags = props.value === undefined ? [] : props.value;
  if (!Array.isArray(tagList)) return;

  const onTagChange = tagValue => checked => {
    const handler = props.onChange;
    if (!handler) return;

    let nextSelectedTags;
    if (singleMode) {
      nextSelectedTags = checked ? [tagValue] : [];
    } else {
      nextSelectedTags = checked
        ? [...selectedTags, tagValue]
        : selectedTags.filter(t => t !== tagValue);
    }
    handler(nextSelectedTags);
  }

  return tagList.map(item => (
    <CheckableTag
      key={item.value}
      onChange={onTagChange(item.value)}
      checked={selectedTags.indexOf(item.value) !== -1}
    >
      {item.label || item.value}
    </CheckableTag>
  ));
}