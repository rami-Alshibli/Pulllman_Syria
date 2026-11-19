import BookingDetails from "@/components/booking-details";
import Header from "@/components/header";
import LandingTrip from "@/components/landing-trip";
import Loading from "@/components/loading";
import SeatsMapBase, { BusTypes } from "@/components/seats-map";
import { tripsApi } from "@/lib/apis";
import {
  BookingStatus,
  Category,
  Size,
  TripDetails as TripD,
} from "@/lib/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type BookingType = { seatNumber: number; status: BookingStatus };
const TripDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<TripD>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<null | string>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [reservedSeats, setReservedSeats] = useState<BookingType[]>([]);

  useEffect(() => {
    const getData = async (id: string) => {
      try {
        setLoading(true);
        setError(null);
        const res = (await tripsApi.getById(id)) as TripD;
        setTrip(res);
        const initReservedSeats: BookingType[] = [];
        if (Array.isArray(res?.tripBooking)) {
          res.tripBooking.forEach((booking) => {
            if (Array.isArray(booking?.seatNumbers)) {
              booking.seatNumbers.forEach((seat) => {
                initReservedSeats.push({
                  status: booking.status,
                  seatNumber: Number(seat),
                });
              });
            }
          });
        }
        setReservedSeats(initReservedSeats);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    getData(id);
  }, [id]);

  const handleCategory = (cat: Category, size: Size): BusTypes => {
    if (cat === "economy_class") {
      if (size === "large") return "economyLarge";
      else return "economyMedium";
    } else if (cat === "first_class") {
      if (size === "large") return "firstClassLarge";
      else return "firstClassMedium";
    } else if (size === "large") return "businessLarge";
    else return "businessMedium";
  };
  const handleSeatClick = (num: number) => {
    if (selectedSeats.includes(num)) {
      setSelectedSeats((prev) => prev.filter((n) => n !== num));
    } else {
      setSelectedSeats((prev) => prev.concat(num));
    }
  };

  if (loading) return (
    <View className="flex-1 justify-center">
      <Loading />
    </View>
  );
  if (error)
    return (
      <SafeAreaView className="flex-1 bg-[#fff7ed]">
        <View className="items-center g-4 p-4">
          <Text className="text-red-500">حدث خطأ ما</Text>
          <Pressable onPress={() => router.replace("/")}>
            <Text className="text-gray-700 text-xl border p-2 rounded-lg">
              أعد المحاولة
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView className="flex-1 bg-[#fff7ed]">
      <ScrollView className="">
        <Header />
        <LandingTrip
          source={trip?.source ?? ""}
          destination={trip?.destination ?? ""}
          price={trip?.price ?? 0}
        />
        {loading ? (
          <Loading />
        ) : error ? (
          <View className="items-center g-4 p-4">
            <Text className="text-red-500">حدث خطأ ما</Text>
            <Pressable onPress={() => router.replace("/")}>
              <Text className="text-gray-700 text-xl border p-2 rounded-lg">
                أعد المحاولة
              </Text>
            </Pressable>
          </View>
        ) : (
          trip && (
            <View className="m-4 gap-2">
              <SeatsMapBase
                layout={handleCategory(
                  trip?.busModelId.category,
                  trip?.busModelId.size,
                )}
                fixedSeats={
                  reservedSeats
                    .filter((res) => res.status === "confirmed")
                    .map((res) => Number(res.seatNumber))
                }
                reservedSeats={
                  reservedSeats
                    .filter((res) => res.status === "reserved")
                    .map((res) => Number(res.seatNumber))
                }
                bookingSeats={selectedSeats}
                onSeatPress={handleSeatClick}
              />
              <BookingDetails trip={trip} selectedSeats={selectedSeats} />
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TripDetails;

// const Map = ({loading, error, trip}: { loading: boolean, error: null | string, trip: Trip }) => {
//   const router = useRouter();
//   if (loading) return <Loading />;
//   if (error)
//     return (
//       <View className="items-center g-4 p-4">
//         <Text className="text-red-500">حدث خطأ ما</Text>
//         <Pressable onPress={() => router.replace("/")}>
//           <Text className="text-gray-700 text-xl border p-2 rounded-lg">
//             أعد المحاولة
//           </Text>
//         </Pressable>
//       </View>
//     );
//     return (
//       <View className="m-4 gap-2">
//         <SeatsMapBase
//           layout={handleCategory(
//             trip?.busModelId.category,
//             trip?.busModelId.size,
//           )}
//           fixedSeats={
//             reservedSeats.length > 0
//               ? (reservedSeats.map((res) => {
//                   if (res.status === "confirmed") return res.seatNumber;
//                 }) as number[])
//               : []
//           }
//           reservedSeats={
//             reservedSeats.length > 0
//               ? (reservedSeats.map((res) => {
//                   if (res.status === "reserved") return res.seatNumber;
//                 }) as number[])
//               : []
//           }
//           bookingSeats={selectedSeats}
//           onSeatPress={handleSeatClick}
//         />
//         <BookingDetails trip={trip} selectedSeats={selectedSeats} />
//       </View>
//     );
// }
