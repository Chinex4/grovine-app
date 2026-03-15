import React, { useEffect } from "react";
import { View } from "react-native";
import { Asset } from "expo-asset";
import { SvgUri } from "react-native-svg";
import { useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { setCredentials } from "../../store/slices/authSlice";
import { setAccessToken } from "../../utils/api";
import { appStorage } from "../../utils/appStorage";
import { STORAGE_KEYS } from "../../constants/storageKeys";

type JwtPayload = {
  sub?: string;
  email?: string;
  name?: string;
  exp?: number;
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const AppSplashScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const logoUri = Asset.fromModule(
    require("../../assets/images/grov1.svg"),
  ).uri;

  useEffect(() => {
    let mounted = true;

    const runBootFlow = async () => {
      await wait(2000);

      const storedAccessToken = await appStorage.getItem(
        STORAGE_KEYS.accessToken,
      );
      const storedRefreshToken = await appStorage.getItem(
        STORAGE_KEYS.refreshToken,
      );

      if (storedAccessToken) {
        try {
          const decoded = jwtDecode<JwtPayload>(storedAccessToken);
          const expiresAt = decoded?.exp ? decoded.exp * 1000 : 0;
          const isStillValid = expiresAt > Date.now();

          if (isStillValid) {
            setAccessToken(storedAccessToken);
            dispatch(
              setCredentials({
                user: {
                  id: decoded?.sub || "",
                  email: decoded?.email || "",
                  fullName: decoded?.name,
                },
                accessToken: storedAccessToken,
                refreshToken: storedRefreshToken || "",
              }),
            );

            if (mounted) {
              navigation.reset({
                index: 0,
                routes: [{ name: "Main" }],
              });
            }
            return;
          }
        } catch {
          // Invalid or malformed token; clear and continue to onboarding/login decision.
        }

        await appStorage.removeItem(STORAGE_KEYS.accessToken);
        await appStorage.removeItem(STORAGE_KEYS.refreshToken);
        setAccessToken(null);
      }

      const hasOnboarded =
        (await appStorage.getItem(STORAGE_KEYS.hasOnboarded)) === "true" ||
        (await appStorage.getItem(STORAGE_KEYS.hasOnbiardedLegacy)) === "true";

      if (!mounted) return;

      navigation.reset({
        index: 0,
        routes: [{ name: hasOnboarded ? "Login" : "Onboarding" }],
      });
    };

    runBootFlow();

    return () => {
      mounted = false;
    };
  }, [dispatch, navigation]);

  return (
    <View className="flex-1 items-center justify-center bg-[#4CAF50]">
      <SvgUri uri={logoUri} width={160} height={160} />
    </View>
  );
};
