package com.guesthouse.shared.db.roomblock.mapper;

import com.guesthouse.shared.db.roomblock.model.RoomBlockInsertParam;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface RoomBlockCommandMapper {

    void insertRoomBlock(RoomBlockInsertParam roomBlockInsertParam);

    int markRoomBlockInactive(
            @Param("blockId") Long blockId,
            @Param("updatedAt") LocalDateTime updatedAt
    );
}
