import MyText from "@components/MyText";
import { Href, router } from "expo-router";
import React, { forwardRef } from "react";
import { Text, Platform, Pressable, TextProps, TouchableOpacity } from "react-native";

interface Props extends TextProps {
    href: Href<string> | string;
}

const MyLink = forwardRef<Text, Props>((props, ref) => {
    return (
        <TouchableOpacity
            onPress={() => {
                // @ts-ignore: ts(2820) - Ignoring this error for compatibility reasons
                router.push(props.href);
            }}
        >
            <MyText ref={ref} {...props} />
        </TouchableOpacity>
    );
});

export default MyLink;