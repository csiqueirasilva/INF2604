import MyText from '@components/MyText';
import Grandezas1 from '@pages/conceitos-basicos/Grandezas1';
import HomeScreen from '@pages/HomeScreen';
import React from 'react';
import { Platform } from 'react-native';
import { HashRouter, Route, Routes } from 'react-router-dom';

export default function Index() {
  return (
    <>
      { Platform.OS === "web" ?
        <HashRouter>
          <Routes>
            <Route path="/" Component={HomeScreen} />
            <Route path="/conceitos-basicos/grandezas1" Component={Grandezas1} />
          </Routes>
        </HashRouter>
      : <MyText>NYI Mobile routes</MyText> }
    </>
  );
}