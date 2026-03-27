package com.guesthouse.opsapi.hostasset.mapper;

import com.guesthouse.opsapi.hostasset.model.HostAccommodationDetailRecord;
import com.guesthouse.opsapi.hostasset.model.HostAccommodationSummaryRecord;
import com.guesthouse.opsapi.hostasset.model.HostAccommodationTargetRecord;
import com.guesthouse.opsapi.hostasset.model.HostRoomRecord;
import com.guesthouse.opsapi.hostasset.model.HostRoomTargetRecord;
import com.guesthouse.opsapi.hostasset.model.HostRoomTypeOptionRecord;
import com.guesthouse.opsapi.hostasset.model.HostRoomTypeRecord;
import com.guesthouse.opsapi.hostasset.model.HostRoomTypeTargetRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface HostAssetQueryMapper {

    List<HostAccommodationSummaryRecord> findAccommodationSummaries(@Param("hostUserId") Long hostUserId);

    HostAccommodationDetailRecord findAccommodationDetail(
            @Param("accommodationId") Long accommodationId,
            @Param("hostUserId") Long hostUserId
    );

    List<HostRoomTypeRecord> findRoomTypesByAccommodationId(
            @Param("accommodationId") Long accommodationId,
            @Param("hostUserId") Long hostUserId
    );

    List<HostRoomRecord> findRoomsByAccommodationId(
            @Param("accommodationId") Long accommodationId,
            @Param("hostUserId") Long hostUserId
    );

    HostAccommodationTargetRecord lockAccommodationTarget(@Param("accommodationId") Long accommodationId);

    Long countActiveReservationsByAccommodation(
            @Param("accommodationId") Long accommodationId,
            @Param("businessDate") LocalDate businessDate
    );

    HostRoomTypeTargetRecord lockRoomTypeTarget(@Param("roomTypeId") Long roomTypeId);

    HostRoomTypeOptionRecord findRoomTypeOption(@Param("roomTypeId") Long roomTypeId);

    Long countActiveReservationsByRoomType(
            @Param("roomTypeId") Long roomTypeId,
            @Param("businessDate") LocalDate businessDate
    );

    HostRoomTargetRecord lockRoomTarget(@Param("roomId") Long roomId);

    Long countActiveAssignmentsByRoom(
            @Param("roomId") Long roomId,
            @Param("businessDate") LocalDate businessDate
    );
}
