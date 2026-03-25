package com.guesthouse.shared.db.roomblock.mapper;

import com.guesthouse.shared.db.roomblock.model.OpsAccommodationOptionRecord;
import com.guesthouse.shared.db.roomblock.model.OpsRoomBlockMutationTargetRecord;
import com.guesthouse.shared.db.roomblock.model.OpsRoomBlockRecord;
import com.guesthouse.shared.db.roomblock.model.OpsRoomOptionRecord;
import com.guesthouse.shared.db.roomblock.model.OpsRoomTargetRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface RoomBlockQueryMapper {

    List<OpsAccommodationOptionRecord> findAccessibleAccommodations(
            @Param("hostUserId") Long hostUserId,
            @Param("isAdmin") boolean isAdmin
    );

    List<OpsRoomOptionRecord> findActiveRoomsByAccommodationId(@Param("accommodationId") Long accommodationId);

    List<OpsRoomBlockRecord> findRoomBlocks(
            @Param("hostUserId") Long hostUserId,
            @Param("isAdmin") boolean isAdmin,
            @Param("accommodationId") Long accommodationId,
            @Param("roomId") Long roomId
    );

    OpsRoomTargetRecord lockRoomTarget(@Param("roomId") Long roomId);

    Long findOverlappingActiveBlockId(
            @Param("roomId") Long roomId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    OpsRoomBlockMutationTargetRecord lockRoomBlockTarget(@Param("blockId") Long blockId);
}
