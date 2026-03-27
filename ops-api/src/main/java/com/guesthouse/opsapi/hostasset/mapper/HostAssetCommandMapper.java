package com.guesthouse.opsapi.hostasset.mapper;

import com.guesthouse.opsapi.hostasset.model.HostAccommodationInsertParam;
import com.guesthouse.opsapi.hostasset.model.HostRoomInsertParam;
import com.guesthouse.opsapi.hostasset.model.HostRoomTypeInsertParam;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Mapper
public interface HostAssetCommandMapper {

    void insertAccommodation(HostAccommodationInsertParam accommodationInsertParam);

    int updateAccommodation(
            @Param("accommodationId") Long accommodationId,
            @Param("name") String name,
            @Param("address") String address,
            @Param("region") String region,
            @Param("infoText") String infoText,
            @Param("checkInTime") LocalTime checkInTime,
            @Param("checkOutTime") LocalTime checkOutTime,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    int markAccommodationInactive(
            @Param("accommodationId") Long accommodationId,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    void insertRoomType(HostRoomTypeInsertParam roomTypeInsertParam);

    int updateRoomType(
            @Param("roomTypeId") Long roomTypeId,
            @Param("name") String name,
            @Param("baseCapacity") Integer baseCapacity,
            @Param("maxCapacity") Integer maxCapacity,
            @Param("basePrice") BigDecimal basePrice,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    int markRoomTypeInactive(
            @Param("roomTypeId") Long roomTypeId,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    void insertRoom(HostRoomInsertParam roomInsertParam);

    int updateRoom(
            @Param("roomId") Long roomId,
            @Param("roomCode") String roomCode,
            @Param("status") String status,
            @Param("memo") String memo,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    int markRoomInactive(
            @Param("roomId") Long roomId,
            @Param("updatedAt") LocalDateTime updatedAt
    );
}
