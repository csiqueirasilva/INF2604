import { Link, Redirect, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <Redirect href={"/"} />
  );
}