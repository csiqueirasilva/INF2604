import React from 'react';
import { Text, View } from 'react-native';
import { Href, Link, router } from 'expo-router';
import { Tooltip, Button, IconButton } from 'react-native-paper';
import MyText from '@components/MyText';
import MyLink from '@components/MyLink';
import * as Icons from '@expo/vector-icons';
import BackButton from '@components/BackButton';

interface BackButtonWithTooltipProps {
  url?: Href<string | object>;
  displayLabel?: string;
  hoverLabel?: string;
}

const BackButtonWithTooltip: React.FC<BackButtonWithTooltipProps> = ({ url = "/", displayLabel = "Página inicial", hoverLabel = "Página inicial" }) => {
  return (
    <Tooltip title={hoverLabel} leaveTouchDelay={0} enterTouchDelay={100}>
      <BackButton url={url} />
    </Tooltip>
  );
};

export default BackButtonWithTooltip;