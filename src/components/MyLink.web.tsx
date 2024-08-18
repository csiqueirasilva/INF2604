import MyText from "@components/MyText";
import React, { forwardRef } from "react";
import { Text, Platform, Pressable, TextProps, TouchableOpacity } from "react-native";
import { useNavigate } from "react-router-dom";

interface Props extends TextProps {
    href: string;
}

const MyLink = forwardRef<Text, Props>((props, ref) => {
    const navigate = useNavigate();
    
    return (
        <TouchableOpacity
            onPress={(ev) => {
                ev.preventDefault();
                navigate(props.href);
            }}
        >
            <MyText ref={ref} {...props} />
        </TouchableOpacity>
    );
});

export default MyLink;
