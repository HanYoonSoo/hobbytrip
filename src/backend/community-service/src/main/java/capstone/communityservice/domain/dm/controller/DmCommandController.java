package capstone.communityservice.domain.dm.controller;

import capstone.communityservice.domain.dm.dto.*;
import capstone.communityservice.domain.dm.service.DmCommandService;
import capstone.communityservice.domain.server.dto.ServerJoinRequestDto;
import capstone.communityservice.domain.server.dto.ServerResponseDto;
import capstone.communityservice.global.common.dto.DataResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/dm")
public class DmCommandController {

    private final DmCommandService dmCommandService;

    @PostMapping
    public DataResponseDto<Object> create(@Valid @RequestBody DmCreateRequestDto requestDto){
        DmResponseDto response = dmCommandService.save(requestDto);
        return DataResponseDto.of(response);
    }

    /**
     * 기존 DM에 있던 사람인지 검사를 할 때의 처리 고민.
     */
    @PostMapping("/join")
    public DataResponseDto<Object> join(@Valid @RequestBody DmJoinRequestDto requestDto){
        DmResponseDto response = dmCommandService.join(requestDto);
        return DataResponseDto.of(response);
    }

    @PatchMapping
    public DataResponseDto<Object> update(@Valid @RequestBody DmUpdateRequestDto requestDto){
        DmResponseDto response = dmCommandService.update(requestDto);

        return DataResponseDto.of(response);
    }

    @DeleteMapping
    public DataResponseDto<Object> delete(@Valid @RequestBody DmDeleteRequestDto requestDto){
        dmCommandService.delete(requestDto);

        return DataResponseDto.of("Dm delete success!!");
    }
}
