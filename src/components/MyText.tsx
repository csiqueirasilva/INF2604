import { forwardRef } from "react";
import { Text, TextProps } from "react-native";

interface Props extends TextProps {
}

const MyText = forwardRef<Text, Props>(({ className, ...props }, ref) => {
    return <Text ref={ref} {...props} className={`font-roboto ${className}`} />
});

export default MyText