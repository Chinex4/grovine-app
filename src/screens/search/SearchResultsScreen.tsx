import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { ShoppingCart } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { foodService } from "../../utils/foodService";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

export const SearchResultsScreen = ({ navigation, route }: any) => {
  const [query, setQuery] = useState(route?.params?.query || "");
  const debouncedQuery = useDebouncedValue(query.trim(), 350);

  const {
    data: searchResponse,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["product-search-results", debouncedQuery],
    queryFn: () => foodService.searchFoods(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  const results = useMemo(() => searchResponse?.data || [], [searchResponse]);

  return (
    <ScreenWrapper bg="#F7F7F7">
      <View className="flex-1">
        <View className="px-6 pt-10 pb-4 bg-white border-b border-gray-50 flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-9 h-9 items-center justify-center bg-gray-50 border border-gray-100 rounded-lg mr-3"
          >
            <Ionicons name="arrow-back" size={18} color="#424242" />
          </TouchableOpacity>

          <View className="flex-1 h-12 bg-gray-50 border border-gray-100 rounded-xl flex-row items-center px-4">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search for groceries, recipes etc"
              className="flex-1 font-satoshi text-[14px] text-[#424242]"
              placeholderTextColor="#9E9E9E"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={18} color="#424242" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isFetching ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : isError ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-[#FF5252] font-satoshi font-bold text-center">
              Failed to fetch search results
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mt-4 bg-[#4CAF50] px-6 py-2 rounded-xl"
            >
              <Text className="text-white font-satoshi font-bold">Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : results.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="search-outline" size={64} color="#BDBDBD" />
            <Text className="text-[#9E9E9E] font-satoshi font-bold mt-4 text-[16px]">
              No results found for "{debouncedQuery || query}"
            </Text>
            <Text className="text-[#BDBDBD] font-satoshi text-center mt-2">
              Try searching for something else
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 40,
            }}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("ProductDetail", { productId: item.id })
                }
                className="w-[48%] mb-6"
              >
                <View className="relative">
                  <View className="bg-white rounded-2xl overflow-hidden border border-gray-50 shadow-sm">
                    <Image
                      source={{
                        uri:
                          item.media?.url || "https://via.placeholder.com/160",
                      }}
                      className="w-full h-32"
                      resizeMode="cover"
                    />
                    <View className="absolute bottom-2 left-2 bg-white/80 px-2 py-0.5 rounded-md flex-row items-center">
                      <Ionicons
                        name="basket-outline"
                        size={8}
                        color="#424242"
                      />
                      <Text className="text-[#424242] text-[6px] font-bold ml-1">
                        {item.stock || 0} Left
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="mt-3">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text
                      className="text-[13px] font-satoshi font-bold text-[#424242] flex-1 mr-1"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text className="text-[13px] font-satoshi font-bold text-[#424242]">
                      ₦{item.price?.toLocaleString() || "0"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                    }}
                    className="bg-[#4CAF50] h-10 rounded-xl flex-row items-center justify-center"
                  >
                    <Text className="text-white font-satoshi font-bold text-[10px] mr-2">
                      Add to Cart
                    </Text>
                    <ShoppingCart size={12} color="white" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </ScreenWrapper>
  );
};
